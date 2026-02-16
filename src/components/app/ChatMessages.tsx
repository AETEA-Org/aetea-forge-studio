import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/ui/markdown";
import { formatDistanceFromUTC } from "@/lib/dateUtils";
import type { ChatMessage } from "@/types/api";

interface ChatMessagesProps {
  messages: ChatMessage[];
  streamingContent?: string;
  isStreaming?: boolean;
  updateMessage?: string | null;
}

export function ChatMessages({
  messages,
  streamingContent,
  isStreaming,
  updateMessage,
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef<number>(0);
  const prevStreamingContentRef = useRef<string>("");
  const prevFirstMessageIdRef = useRef<string | null>(null);

  // Scroll to bottom when:
  // 1. Chat is first loaded or switched (messages go from 0/empty to having messages, OR first message ID changed)
  // 2. A new message is added AND streaming is active
  // 3. Streaming content is actively updating (during AI response streaming)
  useEffect(() => {
    if (!scrollRef.current) return;

    const currentMessageCount = messages.length;
    const prevMessageCount = prevMessageCountRef.current;
    const messageCountIncreased = currentMessageCount > prevMessageCount;
    const streamingContentChanged = streamingContent !== prevStreamingContentRef.current;
    
    // Get first message ID to detect chat switches
    const firstMessageId = messages.length > 0 ? messages[0].message_id : null;
    const chatSwitched = firstMessageId !== null && firstMessageId !== prevFirstMessageIdRef.current;
    
    // Detect initial chat load: went from 0/empty to having messages, not streaming
    const isInitialLoad = prevMessageCount === 0 && currentMessageCount > 0 && !isStreaming && !updateMessage;
    
    // Auto-scroll if:
    // - Initial chat load or chat switched (opening a past chat), OR
    // - A new message was added AND streaming is active, OR
    // - Streaming content is actively updating (user sent message, AI is responding)
    const shouldAutoScroll = 
      (isInitialLoad || chatSwitched) ||
      (messageCountIncreased && (isStreaming || updateMessage !== null)) ||
      (isStreaming && streamingContentChanged && streamingContent);

    if (shouldAutoScroll) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }

    // Update refs for next comparison
    prevMessageCountRef.current = currentMessageCount;
    prevStreamingContentRef.current = streamingContent || "";
    prevFirstMessageIdRef.current = firstMessageId;
  }, [messages, streamingContent, updateMessage, isStreaming]);

  return (
    <div className="flex-1 h-full overflow-y-auto overflow-x-hidden custom-scrollbar" ref={scrollRef}>
      <div className="p-4 space-y-4 min-w-0">
        {messages.map((message) => (
          <div
            key={message.message_id}
            className={cn(
              "flex flex-col gap-1",
              message.role === "user" ? "items-end" : "items-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-4 py-2.5 break-words",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}
              style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
            >
              <Markdown className="text-sm leading-relaxed break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {message.content}
              </Markdown>
            </div>
            <span className="text-xs text-muted-foreground px-1">
              {formatDistanceFromUTC(message.timestamp, { addSuffix: true })}
            </span>
          </div>
        ))}

        {/* Update message (temporary, lighter color) */}
        {updateMessage && (
          <div className="flex flex-col gap-1 items-start">
            <div className="max-w-[80%] rounded-lg px-4 py-2.5 bg-muted/50 text-muted-foreground break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              <p className="text-sm italic break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{updateMessage}</p>
            </div>
          </div>
        )}

        {/* Streaming message */}
        {isStreaming && streamingContent && (
          <div className="flex flex-col gap-1 items-start">
            <div className="max-w-[80%] rounded-lg px-4 py-2.5 bg-muted text-foreground break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              <Markdown className="text-sm leading-relaxed break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {streamingContent}
              </Markdown>
              <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
            </div>
            <span className="text-xs text-muted-foreground px-1">
              Just now
            </span>
          </div>
        )}

        {messages.length === 0 && !isStreaming && !updateMessage && (
          <div className="flex items-center justify-center h-full text-center py-12">
            <div className="space-y-2 max-w-sm">
              <img src="/favicon.png" alt="AETEA" className="h-8 w-8 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Start a conversation to get AI assistance with your project.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
