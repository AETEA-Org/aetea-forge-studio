import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatMessages } from "./ChatMessages";
import { ChatInput, type ChatInputHandle } from "./ChatInput";
import { ChatPanelDropZone } from "./ChatPanelDropZone";
import { useChatMessages } from "@/hooks/useChats";
import { useChatContext } from "@/hooks/useChatContext";
import { useModification } from "@/hooks/useModification";
import { useAutoMessage } from "@/hooks/useAutoMessage";
import { resolveStreamAssetHints } from "@/services/api";
import {
  cancelRun,
  editTurn,
  followRun,
  getRunStatus,
  runTurn,
  type ProgressStep,
} from "@/services/agentRun";
import { invalidateForDataChange } from "@/services/dataChanged";
import { AgentThinking } from "@/components/app/AgentThinking";
import { AgentSteps } from "@/components/app/AgentSteps";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { ChatMessage, ChatRenderableAsset, StreamAssetHint } from "@/types/api";
import type { CampaignTab } from "./CampaignTabs";
import type { AutoSendOptions } from "@/contexts/AutoMessageContext";

/**
 * The tab a progress step is rewriting, when it is rewriting one.
 *
 * The backend names a section write `section-<key>` and the creative direction
 * `creative`; those keys are the tab ids, so the overlay can cover exactly the
 * view whose data is mid-write and leave the others readable.
 */
function modifyingTabForStep(stepId: string): string | null {
  if (stepId === "creative") return "creative";
  if (stepId.startsWith("section-")) return stepId.slice("section-".length);
  return null;
}

interface AICopilotPanelProps {
  chatId: string;
  /** Present whenever the chat is linked to a campaign (same as AppLayout `hasCampaign`). */
  campaignId: string | undefined;
  activeTab: CampaignTab;
  selectedTaskId: string | null;
  collapsed: boolean;
  onToggle: () => void;
}

export function AICopilotPanel({
  chatId,
  campaignId,
  activeTab,
  selectedTaskId,
  collapsed,
  onToggle,
}: AICopilotPanelProps) {
  const [streamingContent, setStreamingContent] = useState("");
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [thinkingText, setThinkingText] = useState("");
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [streamingAssets, setStreamingAssets] = useState<ChatRenderableAsset[]>([]);
  const [panelWidth, setPanelWidth] = useState(450); // Default 450px (increased from 384px)
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const chatInputRef = useRef<ChatInputHandle>(null);
  
  // Refs to track modification state
  const isModifyingActiveRef = useRef(false);
  // One re-attach per mounted chat; sending a message drives its own stream.
  const reattachedRef = useRef(false);
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

  const mergeStreamAssets = useCallback(async (hints: StreamAssetHint[]) => {
    if (!user?.email || hints.length === 0) return;
    const resolved = await resolveStreamAssetHints(user.email, hints);
    setStreamingAssets((prev) => {
      const m = new Map(prev.map((a) => [a.id, a]));
      resolved.forEach((a) => m.set(a.id, a));
      return Array.from(m.values());
    });
  }, [user?.email]);

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
      setStreamingAssets([]);
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
        await runTurn(
          {
            userEmail: user.email,
            chatId,
            message,
            mode: "campaign",
            files,
          },
          {
            onToken: (_delta, accumulated) => {
              if (updateClearTimeoutRef.current) {
                clearTimeout(updateClearTimeoutRef.current);
              }
              updateClearTimeoutRef.current = setTimeout(() => {
                setUpdateMessage(null);
                updateClearTimeoutRef.current = null;
              }, 500);
              setStreamingContent(accumulated);
            },
            onThinking: (_delta, accumulated) => setThinkingText(accumulated),
            onProgress: (step) => {
              setUpdateMessage(step.label);
              // A section write in flight covers the tab showing that section,
              // so a half-written brief is never read as the finished one.
              const tab = modifyingTabForStep(step.step_id);
              if (tab) {
                if (step.state === "started") {
                  isModifyingActiveRef.current = true;
                  setIsModifying(true, `tab:${tab}`);
                } else if (isModifyingActiveRef.current) {
                  isModifyingActiveRef.current = false;
                  setIsModifying(false, null);
                }
              }
              setSteps((current) => {
                const at = current.findIndex((s) => s.step_id === step.step_id);
                if (at === -1) return [...current, step];
                const next = [...current];
                next[at] = step;
                return next;
              });
            },
            onAssets: (assets) => {
              mergeStreamAssets(
                assets.map((a) => ({ id: a.id, mime_type: a.mime_type ?? "" }))
              ).catch(() => {});
            },
            onCampaign: () => {
              // A section landed: refresh the tab showing it.
              queryClient.invalidateQueries({ queryKey: ["campaign"] });
              if (campaignId && user?.email) {
                queryClient.invalidateQueries({
                  queryKey: ["creative", campaignId, user.email],
                });
              }
            },
            onDataChanged: (entity) => {
              invalidateForDataChange(queryClient, entity, {
                chatId,
                campaignId,
                userEmail: user?.email,
              });
            },
            onCancelled: () => {
              setUpdateMessage(null);
              setStreamingContent("");
              setSteps([]);
              setThinkingText("");
              setIsStreaming(false);
              setOptimisticMessages([]);
              if (isModifyingActiveRef.current) {
                isModifyingActiveRef.current = false;
                setIsModifying(false, null);
              }
              queryClient.refetchQueries({ queryKey: ["chat-messages", chatId] });
            },
            onComplete: async () => {
              if (updateClearTimeoutRef.current) {
                clearTimeout(updateClearTimeoutRef.current);
                updateClearTimeoutRef.current = null;
              }
              setUpdateMessage(null);
              await queryClient.refetchQueries({
                queryKey: ["chat-messages", chatId],
              });
              setStreamingContent("");
              setStreamingAssets([]);
              setThinkingText("");
              setSteps([]);
              setIsStreaming(false);
              setOptimisticMessages([]);
              if (isModifyingActiveRef.current) {
                setIsModifying(false, null);
                isModifyingActiveRef.current = false;
              }
              override?.onComplete?.();
            },
            onError: (errorMsg: string) => {
              if (updateClearTimeoutRef.current) {
                clearTimeout(updateClearTimeoutRef.current);
                updateClearTimeoutRef.current = null;
              }
              setUpdateMessage(null);
              setStreamingContent("");
              setStreamingAssets([]);
              setThinkingText("");
              setSteps([]);
              setIsStreaming(false);
              setOptimisticMessages([]);
              setError(errorMsg);
              isModifyingActiveRef.current = false;
              setIsModifying(false, null);
              toast({
                title: "Something went wrong",
                description: errorMsg,
                variant: "destructive",
              });
              override?.onError?.(errorMsg);
            },
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
        setStreamingAssets([]);
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
    [chatId, campaignId, context, contextLabel, user, setIsModifying, queryClient, toast, mergeStreamAssets]
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

  // Re-attach to a run already in flight.
  //
  // A chat with a campaign renders this panel rather than ChatView, which had
  // the only copy of this. Refreshing mid-answer therefore left the run going
  // on the server with nothing following it, and the reply never arrived.
  useEffect(() => {
    if (!chatId || !user?.email || reattachedRef.current) return;
    const controller = new AbortController();
    const email = user.email;

    getRunStatus(chatId, email)
      .then((status) => {
        if (!status.active || controller.signal.aborted) return;
        reattachedRef.current = true;
        setIsStreaming(true);
        return followRun(
          chatId,
          email,
          {
            onToken: (_delta, accumulated) => {
              setUpdateMessage(null);
              setStreamingContent(accumulated);
            },
            onThinking: (_delta, accumulated) => setThinkingText(accumulated),
            onProgress: (step) => {
              setUpdateMessage(step.label);
              setSteps((current) => {
                const at = current.findIndex((s) => s.step_id === step.step_id);
                if (at === -1) return [...current, step];
                const next = [...current];
                next[at] = step;
                return next;
              });
            },
            onAssets: (assets) => {
              mergeStreamAssets(
                assets.map((a) => ({ id: a.id, mime_type: a.mime_type ?? "" }))
              ).catch(() => {});
            },
            onDataChanged: (entity) => {
              invalidateForDataChange(queryClient, entity, {
                chatId,
                campaignId,
                userEmail: email,
              });
            },
            onComplete: async () => {
              setUpdateMessage(null);
              await queryClient.refetchQueries({
                queryKey: ["chat-messages", chatId],
              });
              setStreamingContent("");
              setThinkingText("");
              setSteps([]);
              setIsStreaming(false);
            },
            onCancelled: () => {
              setUpdateMessage(null);
              setStreamingContent("");
              setThinkingText("");
              setSteps([]);
              setIsStreaming(false);
            },
            onError: () => {
              setUpdateMessage(null);
              setStreamingContent("");
              setThinkingText("");
              setSteps([]);
              setIsStreaming(false);
            },
          },
          // Resume from where this client got to, rather than replaying the
          // whole run from the beginning.
          { signal: controller.signal, sinceEventId: status.last_event_id },
        );
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [chatId, campaignId, user?.email, queryClient, mergeStreamAssets]);

  // Rewriting a message replaces everything after it, then re-answers.
  const handleEditMessage = useCallback(
    async (messageId: string, text: string) => {
      if (!user?.email || !chatId) return;
      setStreamingContent("");
      setThinkingText("");
      setSteps([]);
      setIsStreaming(true);
      try {
        await editTurn(chatId, messageId, {
          userEmail: user.email,
          message: text,
          mode: "campaign",
        });
      } catch (err) {
        setIsStreaming(false);
        toast({
          title: "Could not edit that message",
          description: err instanceof Error ? err.message : "Try again in a moment.",
          variant: "destructive",
        });
        return;
      }
      await queryClient.refetchQueries({ queryKey: ["chat-messages", chatId] });
      const email = user.email;
      await followRun(chatId, email, {
        onToken: (_d, accumulated) => setStreamingContent(accumulated),
        onThinking: (_d, accumulated) => setThinkingText(accumulated),
        onProgress: (step) =>
          setSteps((current) => {
            const at = current.findIndex((s) => s.step_id === step.step_id);
            if (at === -1) return [...current, step];
            const next = [...current];
            next[at] = step;
            return next;
          }),
        onAssets: (assets) => {
          mergeStreamAssets(
            assets.map((a) => ({ id: a.id, mime_type: a.mime_type ?? "" }))
          ).catch(() => {});
        },
        onDataChanged: (entity) =>
          invalidateForDataChange(queryClient, entity, {
            chatId, campaignId, userEmail: email,
          }),
        onComplete: async () => {
          await queryClient.refetchQueries({ queryKey: ["chat-messages", chatId] });
          setStreamingContent("");
          setThinkingText("");
          setSteps([]);
          setIsStreaming(false);
        },
        onError: () => setIsStreaming(false),
        onCancelled: () => setIsStreaming(false),
      });
    },
    [user?.email, chatId, campaignId, queryClient, toast, mergeStreamAssets]
  );

  // Stopping is the send button's other job while a run is going, so the
  // handler lives with the send path rather than beside a separate control.
  const handleStop = useCallback(async () => {
    if (!user?.email || !chatId) return;
    await cancelRun(chatId, user.email);
    setIsStreaming(false);
    setSteps([]);
    setThinkingText("");
    setStreamingContent("");
    setUpdateMessage(null);
    await queryClient.refetchQueries({ queryKey: ["chat-messages", chatId] });
  }, [user?.email, chatId, queryClient]);

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
    setStreamingAssets([]);
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

        {/* Chat Content + drag-and-drop attach */}
        <ChatPanelDropZone
          className="flex-1 min-h-0 min-w-0 overflow-hidden"
          disabled={isStreaming}
          onFilesDropped={(files) => chatInputRef.current?.addFiles(files)}
        >
          <ChatMessages
            surface="panel"
            onEditMessage={handleEditMessage}
            messages={messages}
            threadAssets={messagesData?.assets ?? []}
            streamingAssets={streamingAssets}
            streamingContent={streamingContent}
            isStreaming={isStreaming}
            updateMessage={updateMessage}
          />
          {error && (
            <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}
          {(thinkingText || steps.length > 0) && (
            <div className="space-y-2 px-4 pb-2">
              <AgentThinking text={thinkingText} />
              <AgentSteps steps={steps} />
            </div>
          )}

          <ChatInput
            ref={chatInputRef}
            onSend={handleSendMessage}
            isStreaming={isStreaming}
            onStop={handleStop}
            disabled={false}
            prefillMessage={autoMessage?.text ?? null}
            onPrefillComplete={handlePrefillComplete}
            prefillMode={autoMessage?.prefillMode}
          />
        </ChatPanelDropZone>
        </div>
    </aside>
    </>
  );
}
