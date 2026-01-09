import { useState, useEffect, useCallback, useRef } from "react";
import { Bot, ChevronLeft, ChevronRight, Plus, History, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatHistoryDialog } from "./ChatHistoryDialog";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { useChatMessages } from "@/hooks/useChats";
import { useChatContext } from "@/hooks/useChatContext";
import { useModification } from "@/hooks/useModification";
import { sendChatMessage } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { ChatMessage } from "@/types/api";
import type { ProjectTab } from "./ProjectTabs";

interface AICopilotPanelProps {
  projectId: string;
  activeTab: ProjectTab;
  selectedTaskId: string | null;
  collapsed: boolean;
  onToggle: () => void;
}

export function AICopilotPanel({
  projectId,
  activeTab,
  selectedTaskId,
  collapsed,
  onToggle,
}: AICopilotPanelProps) {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [willModify, setWillModify] = useState(false);
  const [modifyingContext, setModifyingContext] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [panelWidth, setPanelWidth] = useState(450); // Default 450px (increased from 384px)
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  
  // Refs to track modification state and prevent redundant updates
  const isModifyingActiveRef = useRef(false);
  const modificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { setIsModifying } = useModification();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get context information using props passed from AppLayout
  const { context, contextLabel } = useChatContext({
    activeTab,
    selectedTaskId,
  });

  const { data: messagesData } = useChatMessages(activeChatId, projectId);

  // Get messages or empty array, and combine with optimistic messages
  const serverMessages: ChatMessage[] = messagesData?.messages || [];
  const messages = [...serverMessages, ...optimisticMessages];

  // Handle new chat creation
  const handleNewChat = useCallback(() => {
    const newChatId = crypto.randomUUID();
    setActiveChatId(newChatId);
    setStreamingContent("");
    setUpdateMessage(null);
    setWillModify(false);
    setModifyingContext(null);
    setOptimisticMessages([]);
    setError(null);
  }, []);

  const [isStreaming, setIsStreaming] = useState(false);

  // Handle message sending
  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!user?.email) {
        toast({
          title: "Authentication required",
          description: "Please sign in to send messages.",
          variant: "destructive",
        });
        return;
      }

      // Create new chat if none exists
      if (!activeChatId) {
        const newChatId = crypto.randomUUID();
        setActiveChatId(newChatId);
      }

      const chatId = activeChatId || crypto.randomUUID();

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
      setWillModify(false);
      setModifyingContext(null);
      setIsStreaming(true);
      setError(null);
      
      // Reset modification tracking refs
      isModifyingActiveRef.current = false;
      if (modificationTimeoutRef.current) {
        clearTimeout(modificationTimeoutRef.current);
        modificationTimeoutRef.current = null;
      }

      console.log('🚀 Sending chat message:', {
        userEmail: user.email,
        projectId,
        chatId,
        context,
        contextLabel,
        message: message.substring(0, 50) + '...',
      });

      try {
        await sendChatMessage(
          user.email,
          projectId,
          chatId,
          context,
          message,
          // onUpdate
          (content: string, willModifyFlag: boolean) => {
            console.log('📝 Update:', content.substring(0, 50), 'willModify:', willModifyFlag);
            setUpdateMessage(content);
            
            // Only trigger modification state ONCE on first will_modify: true
            if (willModifyFlag && !isModifyingActiveRef.current) {
              console.log('🔵 Activating modification overlay');
              isModifyingActiveRef.current = true;
              setWillModify(true);
              setModifyingContext(context);
              setIsModifying(true, context);
            }
          },
          // onContent
          (content: string, willModifyFlag: boolean) => {
            console.log('💬 Content chunk received, length:', content.length);
            // Remove update message when content arrives
            setUpdateMessage(null);
            setStreamingContent(content);
            
            // Only trigger modification state ONCE on first will_modify: true
            if (willModifyFlag && !isModifyingActiveRef.current) {
              console.log('🔵 Activating modification overlay');
              isModifyingActiveRef.current = true;
              setWillModify(true);
              setModifyingContext(context);
              setIsModifying(true, context);
            }
          },
          // onComplete
          async (content: string, willModifyFlag: boolean) => {
            console.log('✅ Complete:', 'willModify:', willModifyFlag, 'isModifyingActiveRef:', isModifyingActiveRef.current);
            setUpdateMessage(null);
            setStreamingContent("");
            setIsStreaming(false);
            setOptimisticMessages([]); // Clear optimistic messages
            
            // WAIT for chat messages to load so complete message is visible
            console.log('💾 Refetching chat messages...');
            await queryClient.refetchQueries({
              queryKey: ['chat-messages', chatId, projectId],
            });
            await queryClient.refetchQueries({
              queryKey: ['chats', projectId],
            });
            console.log('✅ Chat messages loaded - complete message now visible');

            // Handle modification completion
            // Check if modification was ever activated (ref is true), regardless of willModifyFlag in complete
            if (isModifyingActiveRef.current) {
              console.log('🟢 Completing modification - refreshing tab data and removing overlay');
              
              // Clear any existing timeout to prevent race conditions
              if (modificationTimeoutRef.current) {
                clearTimeout(modificationTimeoutRef.current);
              }
              
              // Async function to handle data refresh and blur removal
              (async () => {
                try {
                  // Small delay before starting refresh for smooth UX
                  await new Promise(resolve => setTimeout(resolve, 300));
                  
                  console.log('🔄 Refetching tab data for context:', context);
                  // Use refetchQueries which WAITS for data to actually load
                  // Query keys must match those in useProjectSection/useProjectTasks
                  if (['overview', 'brief', 'research', 'strategy'].includes(context)) {
                    await queryClient.refetchQueries({
                      queryKey: ['project', projectId, context, user.email],
                    });
                    console.log('✅ Tab data refetch complete for:', context);
                  } else if (context) {
                    // Task context - refetch tasks
                    await queryClient.refetchQueries({
                      queryKey: ['project', projectId, 'tasks', user.email],
                    });
                    console.log('✅ Tab data refetch complete for: tasks');
                  }
                  
                  // Small delay before removing blur for smooth transition
                  await new Promise(resolve => setTimeout(resolve, 200));
                  
                  // Data is now loaded, safe to remove blur
                  console.log('🔴 Removing modification overlay - all data loaded');
                  setIsModifying(false, null);
                  setWillModify(false);
                  setModifyingContext(null);
                  isModifyingActiveRef.current = false;
                  modificationTimeoutRef.current = null;
                } catch (error) {
                  console.error('Error during data refresh:', error);
                  // Remove blur even on error to prevent stuck state
                  setIsModifying(false, null);
                  setWillModify(false);
                  setModifyingContext(null);
                  isModifyingActiveRef.current = false;
                  modificationTimeoutRef.current = null;
                }
              })();
            } else {
              // No modification occurred during stream, just clear states
              console.log('⚪ No modification detected - clearing states');
              setWillModify(false);
              setModifyingContext(null);
            }
          },
          // onError
          (errorMsg: string) => {
            console.error('❌ Error from server:', errorMsg);
            
            // Clear any pending timeouts
            if (modificationTimeoutRef.current) {
              clearTimeout(modificationTimeoutRef.current);
              modificationTimeoutRef.current = null;
            }
            
            setUpdateMessage(null);
            setStreamingContent("");
            setIsStreaming(false);
            setWillModify(false);
            setModifyingContext(null);
            setIsModifying(false, null);
            setOptimisticMessages([]);
            setError(errorMsg);
            isModifyingActiveRef.current = false;
            
            toast({
              title: "Error",
              description: errorMsg,
              variant: "destructive",
            });
          }
        );
      } catch (error) {
        console.error("❌ Failed to send message:", error);
        const errorMsg = error instanceof Error ? error.message : "Failed to send message";
        
        // Clear any pending timeouts
        if (modificationTimeoutRef.current) {
          clearTimeout(modificationTimeoutRef.current);
          modificationTimeoutRef.current = null;
        }
        
        setUpdateMessage(null);
        setStreamingContent("");
        setIsStreaming(false);
        setWillModify(false);
        setModifyingContext(null);
        setIsModifying(false, null);
        setOptimisticMessages([]);
        setError(errorMsg);
        isModifyingActiveRef.current = false;
        
        toast({
          title: "Failed to send message",
          description: errorMsg,
          variant: "destructive",
        });
      }
    },
    [activeChatId, context, contextLabel, projectId, user, setIsModifying, queryClient, toast]
  );

  // Reset chat when project changes
  useEffect(() => {
    // Clear any pending modification timeouts
    if (modificationTimeoutRef.current) {
      clearTimeout(modificationTimeoutRef.current);
      modificationTimeoutRef.current = null;
    }
    
    setActiveChatId(null);
    setStreamingContent("");
    setUpdateMessage(null);
    setWillModify(false);
    setModifyingContext(null);
    setOptimisticMessages([]);
    setError(null);
    isModifyingActiveRef.current = false;
    setIsModifying(false, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]); // Only run when project changes, not when setIsModifying changes

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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (modificationTimeoutRef.current) {
        clearTimeout(modificationTimeoutRef.current);
      }
    };
  }, []);

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
          <Bot className="h-5 w-5 text-muted-foreground" />
        </div>
      </aside>
    );
  }

  return (
    <>
    <aside
        ref={panelRef}
        className="h-screen flex bg-sidebar border-l border-sidebar-border transition-all duration-300 relative z-[60]"
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

        <div className="flex flex-col flex-1 h-full">
      {/* Header */}
        <div className="p-3 flex items-center justify-between border-b border-sidebar-border">
          <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground"
        >
              <ChevronRight className="h-4 w-4" />
        </Button>
            <Bot className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI Copilot</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewChat}
              className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground"
              title="New Chat"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHistoryOpen(true)}
              className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground"
              title="Chat History"
            >
              <History className="h-4 w-4" />
            </Button>
          </div>
      </div>

        {/* Chat Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {activeChatId ? (
            <>
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
              />
            </>
          ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Bot className="h-8 w-8 text-primary" />
          </div>
              <h3 className="font-medium text-foreground mb-2">Start a conversation</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                Ask me anything about your project. I'm here to help!
              </p>
              <Button onClick={handleNewChat} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>
          )}
        </div>
        </div>
    </aside>

      <ChatHistoryDialog
        projectId={projectId}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </>
  );
}
