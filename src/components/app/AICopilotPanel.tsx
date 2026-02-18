import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { useChatMessages } from "@/hooks/useChats";
import { useChatContext } from "@/hooks/useChatContext";
import { useModification } from "@/hooks/useModification";
import { useAutoMessage } from "@/hooks/useAutoMessage";
import { sendChatMessage } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { ChatMessage } from "@/types/api";
import type { CampaignTab } from "./CampaignTabs";
import type { AutoSendOptions } from "@/contexts/AutoMessageContext";

interface AICopilotPanelProps {
  chatId: string;
  activeTab: CampaignTab;
  selectedTaskId: string | null;
  collapsed: boolean;
  onToggle: () => void;
}

export function AICopilotPanel({
  chatId,
  activeTab,
  selectedTaskId,
  collapsed,
  onToggle,
}: AICopilotPanelProps) {
  const [streamingContent, setStreamingContent] = useState("");
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [panelWidth, setPanelWidth] = useState(450); // Default 450px (increased from 384px)
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  
  // Refs to track modification state
  const isModifyingActiveRef = useRef(false);
  const updateClearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { setIsModifying } = useModification();
  const { registerHandler, unregisterHandler } = useAutoMessage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get context information using props passed from AppLayout
  const { context, contextLabel } = useChatContext({
    activeTab,
    selectedTaskId,
  });

  // Auto-send: prefill chatbox then send. State holds pending auto-message.
  const [autoMessage, setAutoMessage] = useState<{
    text: string;
    files?: File[];
    contextOverride?: string;
    prefillMode?: "instant" | "typewriter";
    callbacks?: Pick<AutoSendOptions, "onEvent" | "onComplete" | "onError">;
    resolve: () => void;
    reject: (err: unknown) => void;
  } | null>(null);

  // Auto-load chat on page load
  const { data: messagesData } = useChatMessages(chatId);

  // Get messages or empty array, and combine with optimistic messages
  const serverMessages: ChatMessage[] = messagesData?.messages || [];
  const messages = [...serverMessages, ...optimisticMessages];

  const [isStreaming, setIsStreaming] = useState(false);

  // Handle message sending. Optional override for auto-send (context + callbacks).
  type SendOverride = {
    contextOverride?: string;
    onEvent?: (eventName: string) => void;
    onComplete?: () => void;
    onError?: (msg: string) => void;
  };

  const handleSendMessage = useCallback(
    async (
      message: string,
      files?: File[],
      override?: SendOverride
    ) => {
      if (!user?.email || !chatId) {
        toast({
          title: "Authentication required",
          description: "Please sign in to send messages.",
          variant: "destructive",
        });
        return;
      }

      const ctxToUse = override?.contextOverride ?? context;

      // Add optimistic user message immediately
      const optimisticMessage: ChatMessage = {
        message_id: `temp-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };
      setOptimisticMessages([optimisticMessage]);
      
      setStreamingContent("");
      setUpdateMessage(null);
      setIsStreaming(true);
      setError(null);
      
      // Reset modification tracking ref
      isModifyingActiveRef.current = false;

      console.log('🚀 Sending chat message:', {
        userEmail: user.email,
        chatId,
        context: ctxToUse,
        contextLabel,
        message: message.substring(0, 50) + '...',
        filesCount: files?.length || 0,
      });

      try {
        await sendChatMessage(
          user.email,
          chatId,
          message,
          'campaign', // mode is always campaign in campaign view
          ctxToUse,
          files,
          // onUpdate
          (content: string) => {
            console.log('📝 Update:', content.substring(0, 50));
            setUpdateMessage(content);
          },
          // onContent
          (content: string) => {
            console.log('💬 Content chunk received, length:', content.length);
            // Delay clearing update so progress messages (e.g. "Creating image") are visible
            // even when content arrives immediately after
            if (updateClearTimeoutRef.current) {
              clearTimeout(updateClearTimeoutRef.current);
            }
            updateClearTimeoutRef.current = setTimeout(() => {
              setUpdateMessage(null);
              updateClearTimeoutRef.current = null;
            }, 500);
            setStreamingContent(content);
          },
          // onEvent
          (eventName: string) => {
            console.log('🎯 Event received:', eventName);
            if (eventName === 'campaign_modifying') {
              if (!isModifyingActiveRef.current) {
                console.log('🔵 Activating modification overlay');
                isModifyingActiveRef.current = true;
                setIsModifying(true, ctxToUse);
              }
            } else if (eventName === 'campaign_modified') {
              console.log('🔄 Campaign modified - refetching data');
              // Refetch campaign data for current tab
              // Note: This will refetch all campaign queries - the specific tab will be refetched by its hook
              queryClient.invalidateQueries({
                queryKey: ['campaign'],
              }).catch((err) => {
                console.error('Error invalidating campaign data:', err);
              });
            }
            override?.onEvent?.(eventName);
          },
          // onComplete
          async (content: string) => {
            console.log('✅ Complete');
            if (updateClearTimeoutRef.current) {
              clearTimeout(updateClearTimeoutRef.current);
              updateClearTimeoutRef.current = null;
            }
            setUpdateMessage(null);
            
            // WAIT for chat messages to load so complete message is visible
            console.log('💾 Refetching chat messages...');
            await queryClient.refetchQueries({
              queryKey: ['chat-messages', chatId],
            });
            console.log('✅ Chat messages loaded - complete message now visible');
            
            // Now clear streaming state after messages are loaded
            setStreamingContent("");
            setIsStreaming(false);
            setOptimisticMessages([]);

            // Remove blur if modification was active
            if (isModifyingActiveRef.current) {
              console.log('🔴 Removing modification overlay');
              setIsModifying(false, null);
              isModifyingActiveRef.current = false;
            }
            override?.onComplete?.();
          },
          // onError
          (errorMsg: string) => {
            console.error('❌ Error from server:', errorMsg);
            if (updateClearTimeoutRef.current) {
              clearTimeout(updateClearTimeoutRef.current);
              updateClearTimeoutRef.current = null;
            }
            setUpdateMessage(null);
            setStreamingContent("");
            setIsStreaming(false);
            setOptimisticMessages([]);
            setError(errorMsg);
            isModifyingActiveRef.current = false;
            setIsModifying(false, null);
            
            toast({
              title: "Error",
              description: errorMsg,
              variant: "destructive",
            });
            override?.onError?.(errorMsg);
          }
        );
      } catch (error) {
        console.error("❌ Failed to send message:", error);
        const errorMsg = error instanceof Error ? error.message : "Failed to send message";
        if (updateClearTimeoutRef.current) {
          clearTimeout(updateClearTimeoutRef.current);
          updateClearTimeoutRef.current = null;
        }
        setUpdateMessage(null);
        setStreamingContent("");
        setIsStreaming(false);
        setOptimisticMessages([]);
        setError(errorMsg);
        isModifyingActiveRef.current = false;
        setIsModifying(false, null);
        
        toast({
          title: "Failed to send message",
          description: errorMsg,
          variant: "destructive",
        });
        override?.onError?.(errorMsg);
      }
    },
    [chatId, context, contextLabel, user, setIsModifying, queryClient, toast]
  );

  // Auto-send: ref to read pending data in onPrefillComplete (avoids stale closure)
  const autoMessageRef = useRef<typeof autoMessage>(null);
  useEffect(() => {
    autoMessageRef.current = autoMessage;
  }, [autoMessage]);

  // Register triggerAutoSend handler for campaign actions (Generate Key Visual, Complete Task)
  useEffect(() => {
    const handler: (msg: string, opts?: AutoSendOptions) => Promise<void> = (
      message,
      options
    ) => {
      return new Promise<void>((resolve, reject) => {
        setAutoMessage({
          text: message,
          files: options?.files,
          contextOverride: options?.context,
          prefillMode: options?.prefillMode ?? "instant",
          callbacks: {
            onEvent: options?.onEvent,
            onComplete: options?.onComplete,
            onError: options?.onError,
          },
          resolve,
          reject,
        });
      });
    };
    registerHandler(handler);
    return () => unregisterHandler();
  }, [registerHandler, unregisterHandler]);

  const handlePrefillComplete = useCallback(() => {
    const pending = autoMessageRef.current;
    if (!pending) return;
    const { text, files, contextOverride, callbacks, resolve, reject } = pending;
    setAutoMessage(null);
    handleSendMessage(text, files, {
      contextOverride,
      onEvent: callbacks?.onEvent,
      onComplete: () => {
        callbacks?.onComplete?.();
        resolve();
      },
      onError: (msg) => {
        callbacks?.onError?.(msg);
        reject(new Error(msg));
      },
    }).catch((err) => {
      callbacks?.onError?.(err instanceof Error ? err.message : String(err));
      reject(err);
    });
  }, [handleSendMessage]);

  // Reset state when chat changes
  useEffect(() => {
    if (updateClearTimeoutRef.current) {
      clearTimeout(updateClearTimeoutRef.current);
      updateClearTimeoutRef.current = null;
    }
    setStreamingContent("");
    setUpdateMessage(null);
    setOptimisticMessages([]);
    setError(null);
    setAutoMessage(null);
    isModifyingActiveRef.current = false;
    setIsModifying(false, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]); // Only run when chat changes

  // Cleanup update clear timeout on unmount
  useEffect(
    () => () => {
      if (updateClearTimeoutRef.current) {
        clearTimeout(updateClearTimeoutRef.current);
      }
    },
    []
  );

  // Handle panel resizing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      // Min width: 350px, Max width: 800px
      const clampedWidth = Math.min(Math.max(newWidth, 350), 800);
      setPanelWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);


  if (collapsed) {
    return (
      <aside className="h-screen flex flex-col bg-sidebar border-l border-sidebar-border transition-all duration-300 w-12 z-[60]">
        <div className="p-3 flex items-center justify-center border-b border-sidebar-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-2">
          <img src="/favicon.png" alt="AETEA" className="h-5 w-5" />
        </div>
      </aside>
    );
  }

  return (
    <>
    <aside
        ref={panelRef}
        className="h-screen flex bg-sidebar border-l border-sidebar-border transition-all duration-300 relative z-[60] overflow-hidden"
        style={{ width: `${panelWidth}px` }}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
      className={cn(
            "absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors z-20",
            "group flex items-center justify-center",
            isResizing && "bg-primary"
          )}
        >
          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-primary/20 rounded-full p-1">
            <GripVertical className="h-4 w-4 text-primary" />
          </div>
        </div>

        <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
      {/* Header */}
        <div className="p-3 flex items-center justify-between border-b border-sidebar-border min-w-0">
          <div className="flex items-center gap-2 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground shrink-0"
        >
              <ChevronRight className="h-4 w-4" />
        </Button>
            <img src="/favicon.png" alt="AETEA" className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium truncate">AETEA</span>
          </div>
      </div>

        {/* Chat Content */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <ChatMessages
            messages={messages}
            streamingContent={streamingContent}
            isStreaming={isStreaming}
            updateMessage={updateMessage}
          />
          {error && (
            <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}
          <ChatInput
            onSend={handleSendMessage}
            isStreaming={isStreaming}
            contextLabel={contextLabel}
            disabled={false}
            prefillMessage={autoMessage?.text ?? null}
            onPrefillComplete={handlePrefillComplete}
            prefillMode={autoMessage?.prefillMode}
          />
        </div>
        </div>
    </aside>
    </>
  );
}
