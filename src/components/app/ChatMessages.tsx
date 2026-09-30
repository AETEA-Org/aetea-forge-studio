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
  const prevMessageCountRef = useRef<number>(0);
  const prevFirstMessageIdRef = useRef<string | null>(null);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  const updateJumpVisibility = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollHeight > el.clientHeight + 2;
    setShowJumpToBottom(hasOverflow && !isNearBottom(el));
  }, []);

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

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setShowJumpToBottom(false);
  }, []);

  /** Only auto-scroll on first history paint or when switching chats — not while streaming. */
  useEffect(() => {
    if (!scrollRef.current) return;

    const currentMessageCount = messages.length;
    const prevMessageCount = prevMessageCountRef.current;

    const firstMessageId = messages.length > 0 ? messages[0].message_id : null;
    const chatSwitched = firstMessageId !== null && firstMessageId !== prevFirstMessageIdRef.current;

    const isInitialLoad = prevMessageCount === 0 && currentMessageCount > 0 && !isStreaming && !updateMessage;

    const shouldAutoScroll = isInitialLoad || chatSwitched;

    if (shouldAutoScroll) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setShowJumpToBottom(false);
    }

    prevMessageCountRef.current = currentMessageCount;
    prevFirstMessageIdRef.current = firstMessageId;
  }, [messages, isStreaming, updateMessage]);

  /** Re-evaluate jump button when content grows (e.g. streaming) without a scroll event. */
  useLayoutEffect(() => {
    updateJumpVisibility();
  }, [
    messages,
    streamingContent,
    updateMessage,
    isStreaming,
    streamingAssets,
    updateJumpVisibility,
  ]);

  const truncatedUpdateMessage = (() => {
    if (!updateMessage) return null;
    const words = updateMessage.trim().split(/\s+/).filter(Boolean);
    if (words.length <= 10) return updateMessage;
    return `${words.slice(0, 10).join(" ")}...`;
  })();

  return (
    <div className="relative flex-1 h-full min-h-0 flex flex-col">
      <div
        className="flex-1 h-full overflow-y-auto overflow-x-hidden custom-scrollbar"
        ref={scrollRef}
        onScroll={updateJumpVisibility}
      >
      <div className="p-4 space-y-4 min-w-0">
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
