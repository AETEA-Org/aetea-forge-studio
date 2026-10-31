import { Fragment, useEffect, useRef, useMemo, useState, useCallback, useLayoutEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/ui/markdown";
import { MessageActions } from "@/components/app/MessageActions";
import type { Asset, ChatMessage, ChatRenderableAsset } from "@/types/api";
import {
  ChatMessageAssets,
  assetToRenderable,
  type ChatAssetSurface,
} from "@/components/app/ChatMessageAssets";

const NEAR_BOTTOM_PX = 80;

function isNearBottom(el: HTMLElement, threshold = NEAR_BOTTOM_PX): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  /** Top-level assets from GET /chats/.../messages */
  threadAssets?: Asset[];
  /** Resolved assets for the in-progress assistant turn (streaming) */
  streamingAssets?: ChatRenderableAsset[];
  streamingContent?: string;
  isStreaming?: boolean;
  updateMessage?: string | null;
  showEmptyState?: boolean;
  /** When true, skip inline asset thumbnails (canvas chat — objects appear as cards). */
  suppressInlineAssets?: boolean;
  /**
   * Rewind to one of your own messages: hand it back to the composer, where
   * everything after it is replaced when you send.
   *
   * It goes through the composer rather than an editor inside the bubble
   * because a rewound turn needs what the composer holds — the task, the
   * branch, the cards picked as references, the generation settings. Omit to
   * hide the affordance.
   */
  onRewind?: (message: ChatMessage) => void;
  /** The message the composer is currently rewinding to, if any. Everything
   *  from it down is shown as about to be replaced. */
  rewindingFromId?: string | null;
  /** Which surface this conversation is on, so attachments are sized for it. */
  surface?: ChatAssetSurface;
}

export function ChatMessages({
  messages,
  threadAssets = [],
  streamingAssets = [],
  streamingContent,
  isStreaming,
  updateMessage,
  showEmptyState = true,
  suppressInlineAssets = false,
  onRewind,
  rewindingFromId = null,
  surface = "wide",
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const trailingSpaceRef = useRef<HTMLDivElement>(null);
  const readingTopRef = useRef(0);
  /** Whether the end of the conversation is what is being read, and so whether
   *  a reply that grows should keep itself on screen. */
  const followBottomRef = useRef(true);
  const viewportHeightRef = useRef(0);
  const contentHeightRef = useRef(0);
  const prevMessageCountRef = useRef<number>(0);
  const prevFirstMessageIdRef = useRef<string | null>(null);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  const updateJumpVisibility = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollHeight > el.clientHeight + 2;
    setShowJumpToBottom(hasOverflow && !isNearBottom(el));
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (trailingSpaceRef.current) trailingSpaceRef.current.style.height = "0px";
    el.scrollTop = el.scrollHeight;
    readingTopRef.current = el.scrollTop;
    viewportHeightRef.current = el.clientHeight;
    followBottomRef.current = true;
    setShowJumpToBottom(false);
  }, []);

  // The single writer of `scrollTop` for everything that is not a gesture:
  // every content change, every resize. It does one of two jobs depending on
  // where the reader is — stay at the end, or hold the position they chose.
  // Both live here because two mechanisms writing `scrollTop` is what made
  // following a streaming reply impossible before: the old code pinned the old
  // offset on every token, so anything scrolling to the bottom from outside
  // was immediately undone.
  const preserveReadingPosition = useCallback(() => {
    const el = scrollRef.current;
    const content = contentRef.current;
    const trailing = trailingSpaceRef.current;
    if (!el || !content || !trailing) return;
    const contentHeight = content.offsetHeight;
    // Reading the end of the conversation: there is no position to preserve,
    // and a reply still being written has to bring the view down with it.
    if (followBottomRef.current) {
      contentHeightRef.current = contentHeight;
      scrollToBottom();
      return;
    }
    // Holding the position they chose. A taller viewport normally clamps
    // scrollTop near the end of the history, so leave only the trailing space
    // needed to keep the same text at the top — and a reflow at a wider width,
    // loaded fonts or shortened history must not leave the conversation
    // scrolled into empty space.
    if (contentHeight < contentHeightRef.current) {
      readingTopRef.current = Math.min(readingTopRef.current, Math.max(0, contentHeight - el.clientHeight));
    }
    contentHeightRef.current = contentHeight;
    trailing.style.height = `${Math.max(0, Math.ceil(readingTopRef.current + el.clientHeight - contentHeight))}px`;
    el.scrollTop = readingTopRef.current;
    viewportHeightRef.current = el.clientHeight;
    updateJumpVisibility();
  }, [scrollToBottom, updateJumpVisibility]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Ignore native clamping caused by a resize, before ResizeObserver restores it.
    if (el.clientHeight === viewportHeightRef.current) {
      readingTopRef.current = el.scrollTop;
      // Scrolling up is how you stop a streaming reply dragging the view down;
      // coming back to the end is how you start it again. Pinning the position
      // would fight the gesture, so only one of the two ever runs.
      followBottomRef.current = isNearBottom(el);
      if (!followBottomRef.current) preserveReadingPosition();
    }
    updateJumpVisibility();
  }, [preserveReadingPosition, updateJumpVisibility]);

  /** Where the rewind cut falls, and how much sits below it. -1 when idle. */
  const rewindIndex = useMemo(() => {
    if (!rewindingFromId) return -1;
    return messages.findIndex((m) => m.message_id === rewindingFromId);
  }, [messages, rewindingFromId]);
  const doomedCount = rewindIndex === -1 ? 0 : messages.length - rewindIndex;

  const assetById = useMemo(() => {
    const m = new Map<string, Asset>();
    threadAssets.forEach((a) => m.set(a.id, a));
    return m;
  }, [threadAssets]);

  const resolveMessageAssets = (msg: ChatMessage): ChatRenderableAsset[] => {
    const ids = msg.assets ?? [];
    const out: ChatRenderableAsset[] = [];
    ids.forEach((id) => {
      const row = assetById.get(id);
      if (row) out.push(assetToRenderable(row));
    });
    return out;
  };

  /**
   * Jump to the end on first history paint, when switching chats, and when you
   * send — sending is itself a return to the end of the conversation.
   *
   * Following a reply while it streams is `preserveReadingPosition`'s job: it
   * sticks to the end only while you are already there, so scrolling up to
   * re-read something is not undone by the next token.
   */
  useEffect(() => {
    if (!scrollRef.current) return;

    const currentMessageCount = messages.length;
    const prevMessageCount = prevMessageCountRef.current;

    const firstMessageId = messages.length > 0 ? messages[0].message_id : null;
    const chatSwitched = firstMessageId !== null && firstMessageId !== prevFirstMessageIdRef.current;

    const isInitialLoad = prevMessageCount === 0 && currentMessageCount > 0 && !isStreaming && !updateMessage;
    // An optimistic `temp-` row is the only thing that means *you* just sent
    // something. Testing `role === "user"` instead caught the end of a turn as
    // well: stopping clears the optimistic message and refetches, and a normal
    // finish refetches before clearing it, so in both cases the list grows and
    // briefly ends with a user message that nobody sent — which would have
    // yanked a reader who had scrolled up back to the bottom at exactly the
    // moment they were reading. Same convention as the rewind affordance below.
    const sentOwnMessage =
      currentMessageCount > prevMessageCount &&
      messages[currentMessageCount - 1].message_id.startsWith("temp-");

    if (isInitialLoad || chatSwitched || sentOwnMessage) {
      scrollToBottom();
    }

    prevMessageCountRef.current = currentMessageCount;
    prevFirstMessageIdRef.current = firstMessageId;
  }, [messages, isStreaming, updateMessage, scrollToBottom]);

  /** Content grew (e.g. streaming) with no scroll event: hold the reading
   *  position, or stay at the end if that is where the reader is. */
  useLayoutEffect(() => {
    preserveReadingPosition();
  }, [
    messages,
    streamingContent,
    updateMessage,
    isStreaming,
    streamingAssets,
    preserveReadingPosition,
  ]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(preserveReadingPosition);
    observer.observe(el);
    if (contentRef.current) observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [preserveReadingPosition]);

  const truncatedUpdateMessage = (() => {
    if (!updateMessage) return null;
    const words = updateMessage.trim().split(/\s+/).filter(Boolean);
    if (words.length <= 10) return updateMessage;
    return `${words.slice(0, 10).join(" ")}...`;
  })();

  return (
    <div className="relative flex-1 min-h-[72px] flex flex-col">
      {/* overscroll-contain: a wheel that runs out of history stays in this
          pane instead of being handed to the page behind it, which used to
          drag the whole chat — header and composer included — up the screen. */}
      <div
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain chat-scrollbar"
        ref={scrollRef}
        onScroll={handleScroll}
      >
      <div ref={contentRef} className="p-4 space-y-4 min-w-0">
        {messages.map((message, index) => {
          const msgAssets = resolveMessageAssets(message);
          const hasText = Boolean(message.content?.trim());
          const showAssets = !suppressInlineAssets && msgAssets.length > 0;
          if (!showAssets && !hasText) return null;
          const canRewind =
            Boolean(onRewind) &&
            message.role === "user" &&
            hasText &&
            !isStreaming &&
            !message.message_id.startsWith("temp-");
          const isRewindAnchor = rewindingFromId === message.message_id;
          const doomed = rewindIndex !== -1 && index >= rewindIndex;

          return (
            <Fragment key={message.message_id}>
              {/* Outside the dimmed message, not inside it: this line explains
                  the dimming, so fading it with the content it describes is
                  exactly the wrong way round. */}
              {isRewindAnchor ? (
                <div className="flex w-full items-center gap-2">
                  <span className="h-px flex-1 bg-primary/40" aria-hidden="true" />
                  <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {doomedCount === 1
                      ? "1 message will be replaced"
                      : `${doomedCount} messages will be replaced`}
                  </span>
                  <span className="h-px flex-1 bg-primary/40" aria-hidden="true" />
                </div>
              ) : null}
              <div
                className={cn(
                  "message-row flex flex-col gap-1 transition-opacity",
                  message.role === "user" ? "items-end" : "items-start",
                  // Dimmed, not removed: you can still read what you are about
                  // to replace, and nothing is deleted until you press send.
                  doomed && "opacity-[0.34]"
                )}
              >
                <div
                  className={cn(
                    "max-w-[min(80%,100%)] min-w-0 rounded-lg px-4 py-2.5 break-words space-y-3 overflow-hidden",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                  style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
                >
                  {showAssets ? (
                    <ChatMessageAssets
                      assets={msgAssets}
                      surface={surface}
                      className={message.role === "user" ? "[&_button]:border-primary-foreground/20" : undefined}
                    />
                  ) : null}
                  {hasText ? (
                    <Markdown
                      className={cn(
                        "text-sm leading-relaxed break-words",
                        message.role === "user" && "text-primary-foreground [&_a]:text-primary-foreground"
                      )}
                    >
                      {message.content}
                    </Markdown>
                  ) : null}
                </div>
                <MessageActions
                  content={message.content}
                  timestamp={message.timestamp}
                  canRewind={canRewind}
                  onRewind={onRewind ? () => onRewind(message) : undefined}
                  isRewinding={isRewindAnchor}
                  surface={surface}
                />
              </div>
            </Fragment>
          );
        })}

        {truncatedUpdateMessage && (
          <div className="flex flex-col gap-1 items-start">
            <div
              className="max-w-[min(80%,100%)] min-w-0 overflow-hidden rounded-lg px-4 py-2.5 bg-muted/50 text-muted-foreground break-words"
              style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
            >
              <p
                className="text-sm italic break-words"
                style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
              >
                {truncatedUpdateMessage}
              </p>
            </div>
          </div>
        )}

        {isStreaming &&
          ((!suppressInlineAssets && streamingAssets.length > 0) || streamingContent) && (
          <div className="flex flex-col gap-1 items-start">
            <div
              className="max-w-[min(80%,100%)] min-w-0 overflow-hidden rounded-lg px-4 py-2.5 bg-muted text-foreground break-words space-y-3"
              style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
            >
              {!suppressInlineAssets && streamingAssets.length > 0 ? (
                <ChatMessageAssets assets={streamingAssets} surface={surface} />
              ) : null}
              {streamingContent ? (
                <Markdown className="text-sm leading-relaxed break-words">{streamingContent}</Markdown>
              ) : null}
            </div>
            <span className="text-xs text-muted-foreground px-1">Just now</span>
          </div>
        )}

        {showEmptyState &&
          messages.length === 0 &&
          !isStreaming &&
          !updateMessage &&
          !streamingContent &&
          streamingAssets.length === 0 && (
            <div className="flex items-center justify-center h-full text-center py-12">
              <div className="space-y-2 max-w-sm">
                <img src="/favicon.png" alt="AETEA" className="h-8 w-8 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Start a conversation with AETEA about your project.
                </p>
              </div>
            </div>
          )}
      </div>
      <div ref={trailingSpaceRef} aria-hidden="true" />
      </div>

      {showJumpToBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          className={cn(
            "absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full",
            "bg-zinc-500/90 dark:bg-zinc-600/95 border border-white/10 shadow-md",
            "text-white hover:bg-zinc-500 hover:brightness-110",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="h-5 w-5" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
