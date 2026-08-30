import { useEffect, useRef, useMemo, useState, useCallback, useLayoutEffect } from "react";
import { ChevronDown, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";
import { formatDistanceFromUTC } from "@/lib/dateUtils";
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
  /** Rewrite one of your own messages and answer it again. Omit to hide the
   *  affordance — the canvas chat has no room for it. */
  onEditMessage?: (messageId: string, text: string) => void | Promise<void>;
  /** Which surface this conversation is on, so attachments are sized for it. */
  surface?: ChatAssetSurface;
}

/**
 * A message being rewritten, in the place the message was.
 *
 * Editing replaces everything said after it, so this is deliberately explicit
 * rather than an inline-contenteditable trick: you can see what you are about
 * to send, and you can back out.
 */
function MessageEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: string;
  onSave: (text: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  }, []);

  const changed = text.trim() && text.trim() !== initial.trim();

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="w-[min(80%,100%)] min-w-0 rounded-lg border border-primary/40 bg-background p-2">
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 320)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (changed) onSave(text.trim());
            }
          }}
          rows={1}
          className="w-full resize-none bg-transparent text-sm leading-relaxed outline-none"
        />
        <div className="mt-2 flex items-center justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" disabled={!changed} onClick={() => onSave(text.trim())}>
            Send
          </Button>
        </div>
      </div>
      <span className="px-1 text-xs text-muted-foreground">
        Sending replaces everything after this message.
      </span>
    </div>
  );
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
  onEditMessage,
  surface = "wide",
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef<number>(0);
  const prevFirstMessageIdRef = useRef<string | null>(null);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const updateJumpVisibility = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollHeight > el.clientHeight + 2;
    setShowJumpToBottom(hasOverflow && !isNearBottom(el));
  }, []);

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
        {messages.map((message) => {
          const msgAssets = resolveMessageAssets(message);
          const hasText = Boolean(message.content?.trim());
          const showAssets = !suppressInlineAssets && msgAssets.length > 0;
          if (!showAssets && !hasText) return null;
          const canEdit =
            Boolean(onEditMessage) &&
            message.role === "user" &&
            hasText &&
            !isStreaming &&
            !message.message_id.startsWith("temp-");
          const isEditing = editingId === message.message_id;

          if (isEditing) {
            return (
              <MessageEditor
                key={message.message_id}
                initial={message.content}
                onCancel={() => setEditingId(null)}
                onSave={async (text) => {
                  setEditingId(null);
                  await onEditMessage?.(message.message_id, text);
                }}
              />
            );
          }

          return (
            <div
              key={message.message_id}
              className={cn(
                "group flex flex-col gap-1",
                message.role === "user" ? "items-end" : "items-start"
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
              <div className="flex items-center gap-1 px-1">
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => setEditingId(message.message_id)}
                    aria-label="Edit message"
                    title="Edit"
                    className={cn(
                      "rounded p-1 text-muted-foreground opacity-0 transition-opacity",
                      "hover:bg-muted hover:text-foreground",
                      "group-hover:opacity-100 focus-visible:opacity-100",
                      "focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    )}
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                ) : null}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceFromUTC(message.timestamp, { addSuffix: true })}
                </span>
              </div>
            </div>
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
