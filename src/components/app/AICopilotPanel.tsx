import type { RunConnectionState } from "@/services/agentRun";
import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatMessages } from "./ChatMessages";
import { ChatInput, type ChatInputHandle, type ChatSendMeta } from "./ChatInput";
import { ChatPanelDropZone } from "./ChatPanelDropZone";
import { useChatMessages } from "@/hooks/useChats";
import { useRewind } from "@/hooks/useRewind";
import { useChatContext } from "@/hooks/useChatContext";
import { useModification } from "@/hooks/useModification";
import { useAutoMessage } from "@/hooks/useAutoMessage";
import { resolveStreamAssetHints } from "@/services/api";
import {
  ChatBusyError,
  cancelRun,
  followRun,
  getRunStatus,
  runTurn,
  type ProgressStep,
} from "@/services/agentRun";
import { invalidateForDataChange } from "@/services/dataChanged";
import { useNavigate } from "react-router-dom";
import { reportSendFailure } from "@/services/sendFailure";
import { OutOfCredits } from "@/components/app/billing/OutOfCredits";
import { AgentDecision } from "@/components/app/AgentDecision";
import { useChatTier } from "@/hooks/useChatTier";
import { useAgentRunState } from "@/hooks/useAgentRunState";
import { useCampaignProposal } from "@/hooks/useCampaignProposal";
import { AgentProgress } from "@/components/app/AgentProgress";
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
  const runState = useAgentRunState(chatId);
  const subscriptionRef = useRef<AbortController | null>(null);
  
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

  const mergeStreamAssets = useCallback(async (hints: StreamAssetHint[]) => {
    if (!user?.email || hints.length === 0) return;
    const signal = subscriptionRef.current?.signal;
    const resolved = await resolveStreamAssetHints(hints);
    if (signal?.aborted) return;
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
  const {
    arm: armRewind,
    cancel: cancelRewind,
    target: rewindTarget,
    targetId: rewindTargetId,
    replacingCount: rewindReplacingCount,
  } = useRewind(messages);

  const navigate = useNavigate();
  const [isStreaming, setIsStreaming] = useState(false);
  const [connection, setConnection] = useState<RunConnectionState>("idle");
  const [rejoinVersion, setRejoinVersion] = useState(0);
  // The copilot starts billable turns like any other surface, so it gets the
  // same control — and the same stored value as every other surface, rather than
  // a second copy that resets to Auto on every mount. See `useChatTier`.
  const { tier, setTier } = useChatTier(chatId);
  const [outOfCredits, setOutOfCredits] = useState(false);

  // Handle message sending. The third argument arrives from two places and they
  // carry different things: `ChatInput` sends a `ChatSendMeta` (the chosen tier
  // and any generation options), while auto-send passes context and callbacks.
  //
  // Merged on 2026-09-28. Before that this signature named only the auto-send
  // shape, so a `ChatSendMeta` arriving here was read as a field that does not
  // exist. Nothing was being dropped in practice — this panel passed no `tier`,
  // so the picker never rendered and there was no value to lose — but the
  // mismatch meant the tier could not be plumbed through until it was fixed.
  type SendOverride = ChatSendMeta & {
    contextOverride?: string;
    onEvent?: (eventName: string) => void;
    onComplete?: () => void;
    onError?: (msg: string) => void;
  };
  const activeSendRef = useRef<{ controller: AbortController; finish: (error?: string) => void } | null>(null);

  // Typing "go ahead" answers the open card. Same hook the card itself uses, so
  // both see one proposal and the decision goes through the same hash-bound route.
  const { approveIfAffirmative } = useCampaignProposal(chatId);

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
      // A bare "go ahead" while a card is open answers the card. Before this it
      // was spent as an ordinary turn: it cost credits, changed nothing, and the
      // card waited until it expired. Only a bare affirmative with no files —
      // anything carrying further instruction is a real message.
      if (!files?.length && (await approveIfAffirmative(message))) return;

      const ctxToUse = override?.contextOverride ?? context;

      subscriptionRef.current?.abort();
      const controller = new AbortController();
      subscriptionRef.current = controller;
      let finished = false;
      const finish = (error?: string) => {
        if (finished) return;
        finished = true;
        if (activeSendRef.current?.controller === controller) activeSendRef.current = null;
        if (error !== undefined) override?.onError?.(error);
        else override?.onComplete?.();
      };
      activeSendRef.current = { controller, finish };

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
      setThinkingText("");
      setSteps([]);
      setConnection("idle");
      setIsStreaming(true);
      setError(null);
      
      // Reset modification tracking ref
      isModifyingActiveRef.current = false;

      console.log('🚀 Sending chat message:', {
        chatId,
        context: ctxToUse,
        contextLabel,
        message: message.substring(0, 50) + '...',
        filesCount: files?.length || 0,
      });

      // Read before clearing: the turn has to carry it, and the thread should
      // stop looking rewound the moment it is on its way.
      const rewindToMessageId = rewindTargetId ?? undefined;
      cancelRewind();

      try {
        await runTurn(
          {
            chatId,
            message,
            mode: "campaign",
            files,
            rewindToMessageId,
            // Without this anything produced here is filed against the
            // campaign rather than the piece of work being looked at, and
            // never reaches that task's canvas.
            activeTaskId: selectedTaskId ?? undefined,
            tier: override?.tier,
            generationMode: override?.generationMode,
            generationOptions: override?.generationOptions,
          },
          {
            onConnectionState: setConnection,
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
              if (updateClearTimeoutRef.current) clearTimeout(updateClearTimeoutRef.current);
              setUpdateMessage(null);
              setStreamingContent("");
              setStreamingAssets([]);
              setThinkingText("");
              setSteps([]);
              setIsStreaming(false);
              setOptimisticMessages([]);
              setIsModifying(false, null);
              isModifyingActiveRef.current = false;
              void queryClient.refetchQueries({ queryKey: ["chat-messages", chatId] });
              finish();
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
              if (controller.signal.aborted) return;
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
              finish();
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
              finish(errorMsg);
            },
          },
          controller.signal
        );
      } catch (error) {
        if (controller.signal.aborted) return;
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
        setThinkingText("");
        setSteps([]);
        setConnection("idle");
        setOptimisticMessages([]);
        setError(errorMsg);
        isModifyingActiveRef.current = false;
        setIsModifying(false, null);
        
        chatInputRef.current?.restoreDraft(message, files, { generationMode: override?.generationMode, generationOptions: override?.generationOptions });
        if (error instanceof ChatBusyError || error instanceof TypeError) setRejoinVersion(v => v + 1);
        reportSendFailure(error, {
          onOutOfCredits: () => setOutOfCredits(true),
          toast,
          chatId,
          userEmail: user?.email,
          onStopped: () => setIsStreaming(false),
        });
        finish(errorMsg);
      }
    },
    [chatId, campaignId, context, contextLabel, selectedTaskId, user, setIsModifying, queryClient, toast, mergeStreamAssets,
     cancelRewind, rewindTargetId, approveIfAffirmative]
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
    if (!chatId || !user?.email) return;
    subscriptionRef.current?.abort();
    const controller = new AbortController();
    subscriptionRef.current = controller;

    getRunStatus(chatId)
      .then((status) => {
        if (!status.active || controller.signal.aborted) return;
        setIsStreaming(true);
        return followRun(
          chatId,
          {
            onConnectionState: setConnection,
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
            onCampaign: () => { queryClient.invalidateQueries({ queryKey: ["campaign"] }); queryClient.invalidateQueries({ queryKey: ["chat", chatId] }); },
            onDataChanged: (entity) => {
              invalidateForDataChange(queryClient, entity, {
                chatId,
                campaignId,
                userEmail: user?.email,
              });
            },
            onComplete: async () => {
              setUpdateMessage(null);
              await queryClient.refetchQueries({
                queryKey: ["chat-messages", chatId],
              });
              if (controller.signal.aborted) return;
              setStreamingContent("");
              setThinkingText("");
              setSteps([]);
              setIsStreaming(false);
            },
            onCancelled: async () => {
              await queryClient.refetchQueries({ queryKey: ["chat-messages", chatId] });
              if (controller.signal.aborted) return;
              invalidateForDataChange(queryClient, "asset", { chatId, userEmail: user?.email });
              invalidateForDataChange(queryClient, "chat", { chatId, userEmail: user?.email });
              setUpdateMessage(null);
              setStreamingContent("");
              setThinkingText("");
              setSteps([]);
              setIsStreaming(false);
            },
            onError: async () => {
              await queryClient.refetchQueries({ queryKey: ["chat-messages", chatId] });
              if (controller.signal.aborted) return;
              invalidateForDataChange(queryClient, "asset", { chatId, userEmail: user?.email });
              invalidateForDataChange(queryClient, "chat", { chatId, userEmail: user?.email });
              setUpdateMessage(null);
              setStreamingContent("");
              setThinkingText("");
              setSteps([]);
              setIsStreaming(false);
            },
          },
          // Rebuild partial text and progress from retained run events.
          { signal: controller.signal, sinceEventId: 0, runId: status.run_id },
        );
      })
      .catch(() => {
        if (!controller.signal.aborted) { setIsStreaming(true); setConnection("interrupted"); }
      });

    return () => { controller.abort(); subscriptionRef.current?.abort(); };
  }, [chatId, campaignId, user?.email, queryClient, mergeStreamAssets, rejoinVersion]);

  // Stopping is the send button's other job while a run is going, so the
  // handler lives with the send path rather than beside a separate control.
  const handleStop = useCallback(async () => {
    if (!user?.email || !chatId) return;
    if (connection === "stopping") return;
    const controller = subscriptionRef.current;
    setConnection("stopping");
    try {
      await cancelRun(chatId);
      if (controller?.signal.aborted) return;
    } catch (error) {
      if (controller?.signal.aborted) return;
      setConnection("interrupted");
      toast({ title: "Could not stop the run", description: error instanceof Error ? error.message : "Try again.", variant: "destructive" });
      return;
    }
    controller?.abort();
    if (activeSendRef.current?.controller === controller) activeSendRef.current.finish();
    setConnection("idle");
    setIsStreaming(false);
    setOptimisticMessages([]);
    setStreamingAssets([]);
    isModifyingActiveRef.current = false;
    setIsModifying(false, null);
    setSteps([]);
    setThinkingText("");
    setStreamingContent("");
    setUpdateMessage(null);
    await queryClient.refetchQueries({ queryKey: ["chat-messages", chatId] });
  }, [user?.email, chatId, queryClient, connection, toast, setIsModifying]);

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
    setThinkingText("");
    setSteps([]);
    setIsStreaming(false);
    setConnection("idle");
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
            onRewind={armRewind}
            rewindingFromId={rewindTargetId}
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
          <AgentProgress chatId={chatId} isStreaming={isStreaming} onReview={() => {
            const request = runState.request;
            if (chatInputRef.current?.restoreDraft(request?.message ?? messages.filter(m => m.role === "user").at(-1)?.content ?? "", request?.files, { generationMode: request?.generationMode as ChatSendMeta["generationMode"], generationOptions: request?.generationOptions }) && request?.tier) setTier(request.tier);
          }} thinkingText={thinkingText} steps={steps} connection={connection} onReconnect={() => window.location.reload()} onStop={handleStop} />

          <AgentDecision chatId={chatId} ready={!isStreaming} onReady={() => { if (!isStreaming) chatInputRef.current?.focus(); }} />

          {outOfCredits && (
            <OutOfCredits
              compact
              className="mb-3"
              onTopUp={() => navigate("/app/settings?tab=billing")}
            />
          )}

          <div className="chat-scrollbar shrink-0 min-h-0 max-h-[calc(100%-72px)] overflow-y-auto px-3 pb-3">
        <ChatInput
            ref={chatInputRef}
            onSend={(message, files, meta) => {
              setOutOfCredits(false);
              void handleSendMessage(message, files, meta);
            }}
            isStreaming={isStreaming}
            onStop={handleStop}
            disabled={false}
            tier={tier}
            onTierChange={setTier}
            prefillMessage={autoMessage?.text ?? null}
            onPrefillComplete={handlePrefillComplete}
            prefillMode={autoMessage?.prefillMode}
            rewind={
              rewindTarget
                ? {
                    messageId: rewindTarget.message_id,
                    text: rewindTarget.content,
                    replacingCount: rewindReplacingCount,
                    onCancel: cancelRewind,
                  }
                : null
            }
          />
        </div>
        </ChatPanelDropZone>
        </div>
    </aside>
    </>
  );
}
