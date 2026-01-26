import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/ui/markdown";
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

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent, updateMessage, isStreaming]);

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar" ref={scrollRef}>
      <div className="p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.message_id}
            className={cn(
              "flex gap-3",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-4 py-2.5",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}
            >
              <Markdown className="text-sm leading-relaxed">
                {message.content}
              </Markdown>
            </div>
          </div>
        ))}

        {/* Update message (temporary, lighter color) */}
        {updateMessage && (
          <div className="flex gap-3 justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-2.5 bg-muted/50 text-muted-foreground">
              <p className="text-sm italic">{updateMessage}</p>
            </div>
          </div>
        )}

        {/* Streaming message */}
        {isStreaming && streamingContent && (
          <div className="flex gap-3 justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-2.5 bg-muted text-foreground">
              <Markdown className="text-sm leading-relaxed">
                {streamingContent}
              </Markdown>
              <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
            </div>
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
