import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { ArrowLeft, Loader2, PanelLeftOpen } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  getChat,
  getCampaignTask,
  getCampaignTaskDeliverables,
  getChatDeliverables,
  resolveStreamAssetHints,
  patchDeliverableObjectPosition,
  approveDeliverableObject,
  refreshAssetUrls,
} from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useModification } from "@/hooks/useModification";
import { useToast } from "@/hooks/use-toast";
import { ChatBusyError, runTurn, followRun, getRunStatus, cancelRun } from "@/services/agentRun";
import type { AgentTurnHandlers, ProgressStep, RunConnectionState } from "@/services/agentRun";
import { invalidateForDataChange } from "@/services/dataChanged";
import { reportSendFailure } from "@/services/sendFailure";
import { useChatMessages } from "@/hooks/useChats";
import { useRewind } from "@/hooks/useRewind";
import { useCreativeState } from "@/hooks/useCreativeState";
import type { ChatInputHandle, ChatSendMeta } from "@/components/app/ChatInput";
import type {
  ChatMessage,
  ChatRenderableAsset,
  DeliverableObject,
  StreamAssetHint,
} from "@/types/api";
import type { CanvasScope } from "@/services/api";
import { CanvasContext, type CanvasContextValue } from "@/components/app/canvas/canvasContext";
import {
  CanvasWorkspace,
  type KeyVisualProp,
} from "@/components/app/canvas/CanvasWorkspace";
import { CanvasLeftPane } from "@/components/app/canvas/CanvasLeftPane";
import { CanvasSwitcher } from "@/components/app/canvas/CanvasSwitcher";
import {
  autoObjectPosition,
  loadFixturePositions,
  saveFixturePositions,
  type FixturePositions,
  type XY,
} from "@/components/app/canvas/canvasLayout";

export default function DeliverableCanvasPage() {
  const { chatId, taskId } = useParams<{ chatId: string; taskId: string }>();
  const navigate = useNavigate();
  const outletContext = useOutletContext<{
    setActiveTab?: (tab: string) => void;
    setSelectedTaskId?: (id: string | null) => void;
  }>();
  const setActiveTab = outletContext?.setActiveTab;
  const setSelectedTaskId = outletContext?.setSelectedTaskId;

  const { user } = useAuth();
  const { setIsModifying } = useModification();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const branchId = taskId ? `task:${taskId}` : "main";
  // Two canvases share this page: a piece of work, and the campaign itself for
  // everything made outside one. The key identifies whichever is open, so
  // queries, saved layout and per-canvas state follow the switch.
  const isCampaignCanvas = !taskId;
  const canvasKey = taskId ?? `chat:${chatId ?? ""}`;
  const deliverablesKey = useMemo(
    () => ["deliverable-objects", canvasKey, user?.email],
    [canvasKey, user?.email]
  );
  const canvasScope = useMemo<CanvasScope | null>(
    () => (taskId ? { taskId } : chatId ? { chatId } : null),
    [taskId, chatId]
  );

  const [streamingContent, setStreamingContent] = useState("");
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [thinkingText, setThinkingText] = useState("");
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [connection, setConnection] = useState<RunConnectionState>("idle");
  const [runError, setRunError] = useState<string | null>(null);
  const lastSentRef = useRef("");
  const streamControllerRef = useRef<AbortController | null>(null);
  const [reconnectVersion, setReconnectVersion] = useState(0);
  const replayFinishedRef = useRef(false);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
  const [streamingAssets, setStreamingAssets] = useState<ChatRenderableAsset[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  // The canvas gets the same picker as the chat view: a turn started here costs
  // exactly what a turn started there costs.
  const [tier, setTier] = useState<string>("auto");
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [fixturePositions, setFixturePositions] = useState<FixturePositions>(() =>
    loadFixturePositions(canvasKey)
  );
  const chatInputRef = useRef<ChatInputHandle>(null);
  const placedRef = useRef<Set<string>>(new Set());

  const { data: chatData } = useQuery({
    queryKey: ["chat", chatId, user?.email],
    queryFn: () => getChat(chatId!),
    enabled: !!chatId && !!user?.email,
  });
  const campaignId = chatData?.campaign_id ?? undefined;

  const { data: creativeState } = useCreativeState(campaignId);
  const keyVisualAssetId = creativeState?.key_visual_asset_id ?? null;
  const { data: keyVisualUrl } = useQuery({
    queryKey: ["asset-urls", keyVisualAssetId, user?.email],
    queryFn: () =>
      refreshAssetUrls(keyVisualAssetId!).then((r) => r.download_url),
    enabled: !!keyVisualAssetId && !!user?.email,
    staleTime: 50 * 60 * 1000,
  });
  const keyVisual = useMemo<KeyVisualProp>(() =>
    keyVisualAssetId && keyVisualUrl
      ? { assetId: keyVisualAssetId, downloadUrl: keyVisualUrl }
      : null, [keyVisualAssetId, keyVisualUrl]);

  const { data: task, isLoading, error } = useQuery({
    queryKey: ["campaign-task", taskId, user?.email],
    queryFn: () => getCampaignTask(taskId!),
    enabled: !!taskId && !!user?.email,
  });
  const canvasTitle = isCampaignCanvas ? "Campaign" : task?.title ?? "";

  const { data: messagesData } = useChatMessages(chatId, branchId);
  const messages = useMemo<ChatMessage[]>(
    () => [...(messagesData?.messages ?? []), ...optimisticMessages],
    [messagesData?.messages, optimisticMessages]
  );
  const {
    arm: armRewind,
    cancel: cancelRewind,
    targetId: rewindTargetId,
    replacingCount: rewindReplacingCount,
  } = useRewind(messages);

  const { data: deliverablesData } = useQuery({
    queryKey: deliverablesKey,
    queryFn: () =>
      taskId
        ? getCampaignTaskDeliverables(taskId)
        : getChatDeliverables(chatId!),
    enabled: !!(taskId || chatId) && !!user?.email,
  });
  const objects = useMemo<DeliverableObject[]>(
    () => deliverablesData?.objects ?? [],
    [deliverablesData]
  );

  useEffect(() => {
    if (taskId) setSelectedTaskId?.(taskId);
    return () => setSelectedTaskId?.(null);
  }, [taskId, setSelectedTaskId]);

  // Reset per-task local UI state when the task changes.
  //
  // The canvas switcher changes taskId without unmounting this page, so
  // anything left in state belongs to the task we just left. Streamed assets
  // were the one thing missed: switch task while a run is going and the
  // running task's new files rendered on the canvas you had switched to.
  useEffect(() => {
    streamControllerRef.current?.abort();
    setIsStreaming(false);
    setConnection("idle");
    setRunError(null);
    lastSentRef.current = "";
    replayFinishedRef.current = false;
    setStreamingContent("");
    setUpdateMessage(null);
    setOptimisticMessages([]);
    setSelectedAssetIds([]);
    setStreamingAssets([]);
    setThinkingText("");
    setSteps([]);
    setFixturePositions(loadFixturePositions(canvasKey));
    placedRef.current = new Set();
  }, [canvasKey]);

  // Give unplaced objects a grid slot and persist it so layout survives reloads.
  useEffect(() => {
    if (!canvasScope || !user?.email) return;
    objects.forEach((obj, index) => {
      const needsPlacement = obj.canvas_x == null || obj.canvas_y == null;
      if (!needsPlacement || placedRef.current.has(obj.id)) return;
      placedRef.current.add(obj.id);
      const pos = autoObjectPosition(index);
      patchDeliverableObjectPosition(canvasScope, obj.id, {
        canvas_x: pos.x,
        canvas_y: pos.y,
      }).catch(() => {
        placedRef.current.delete(obj.id);
      });
    });
  }, [objects, canvasScope, user?.email]);

  const handleBackToCreative = useCallback(() => {
    setActiveTab?.("creative");
    navigate(`/app/chat/${chatId}`);
  }, [chatId, navigate, setActiveTab]);

  const handleFixtureMoved = useCallback(
    (which: keyof FixturePositions, pos: XY) => {
      setFixturePositions((prev) => {
        const next = { ...prev, [which]: { ...prev[which], ...pos } };
        saveFixturePositions(canvasKey, next);
        return next;
      });
    },
    [canvasKey]
  );

  const handleChatResized = useCallback((size: { width: number; height: number }, position: XY) => {
    setFixturePositions((prev) => {
      const next = { ...prev, chat: { ...prev.chat, ...size, ...position } };
      saveFixturePositions(canvasKey, next);
      return next;
    });
  }, [canvasKey]);

  const handleObjectMoved = useCallback(
    (objectId: string, pos: XY) => {
      if (!canvasScope || !user?.email) return;
      patchDeliverableObjectPosition(canvasScope, objectId, {
        canvas_x: pos.x,
        canvas_y: pos.y,
      }).catch(() => {});
    },
    [canvasScope, user?.email]
  );

  const handleObjectResized = useCallback(
    (objectId: string, size: { width: number; height: number }) => {
      if (!canvasScope || !user?.email) return;
      patchDeliverableObjectPosition(canvasScope, objectId, {
        canvas_width: size.width,
        canvas_height: size.height,
      }).catch(() => {});
    },
    [canvasScope, user?.email]
  );

  const handleApprove = useCallback(
    async (objectId: string) => {
      if (!canvasScope || !user?.email) return;
      setApprovingIds((prev) => new Set(prev).add(objectId));
      try {
        await approveDeliverableObject(canvasScope, objectId);
        await queryClient.invalidateQueries({ queryKey: deliverablesKey });
      } catch (e) {
        toast({
          title: "Failed to approve",
          description: e instanceof Error ? e.message : "An error occurred",
          variant: "destructive",
        });
      } finally {
        setApprovingIds((prev) => {
          const next = new Set(prev);
          next.delete(objectId);
          return next;
        });
      }
    },
    [canvasScope, deliverablesKey, user?.email, queryClient, toast]
  );

  const mergeStreamAssets = useCallback(
    async (hints: StreamAssetHint[], signal?: AbortSignal) => {
      if (!user?.email || hints.length === 0) return;
      const resolved = await resolveStreamAssetHints(hints);
      if (signal?.aborted) return;
      setStreamingAssets((prev) => {
        const m = new Map(prev.map((a) => [a.id, a]));
        resolved.forEach((a) => m.set(a.id, a));
        return Array.from(m.values());
      });
    },
    [user?.email]
  );

  const clearRun = useCallback(() => {
    setIsModifying(false, null);
    setIsStreaming(false);
    setConnection("idle");
    setThinkingText("");
    setSteps([]);
    setStreamingContent("");
    setStreamingAssets([]);
    setUpdateMessage(null);
    setOptimisticMessages([]);
  }, [setIsModifying]);

  // Event callbacks read the latest query keys, but the subscription belongs
  // only to this chat/canvas. A campaign query loading must not abort it.
  const makeHandlers = (controller: AbortController): AgentTurnHandlers => {
    const current = () => !controller.signal.aborted;
    const refresh = () => {
      void queryClient.refetchQueries({ queryKey: ["chat-messages", chatId, branchId] });
      void queryClient.invalidateQueries({ queryKey: deliverablesKey });
      void queryClient.invalidateQueries({ queryKey: ["campaign-task", taskId, user?.email] });
      if (campaignId) void queryClient.invalidateQueries({ queryKey: ["creative", campaignId, user?.email] });
    };
    const finish = () => {
      if (!current()) return;
      clearRun();
      refresh();
    };
    return {
      onConnectionState: (state) => { if (current()) setConnection(state); },
      onToken: (_delta, accumulated) => {
        if (!current()) return;
        setUpdateMessage(null);
        setStreamingContent(accumulated);
      },
      onThinking: (_delta, accumulated) => { if (current()) setThinkingText(accumulated); },
      onProgress: (step) => {
        if (!current()) return;
        setUpdateMessage(step.label);
        setSteps((steps) => {
          const at = steps.findIndex((s) => s.step_id === step.step_id);
          return at === -1 ? [...steps, step] : steps.map((s, i) => i === at ? step : s);
        });
      },
      onAssets: (assets) => {
        if (current()) void mergeStreamAssets(assets.map((a) => ({ id: a.id, mime_type: a.mime_type ?? "" })), controller.signal).catch(() => {});
      },
      onDataChanged: (entity) => {
        if (current()) invalidateForDataChange(queryClient, entity, { chatId, campaignId, taskId, canvasKey, userEmail: user?.email });
      },
      onComplete: finish,
      onCancelled: finish,
      onError: (message) => {
        if (!current()) return;
        finish();
        setRunError(message);
      },
    };
  };
  const handlersRef = useRef(makeHandlers);
  handlersRef.current = makeHandlers;

  const requestRejoin = useCallback((replayFinished: boolean) => {
    replayFinishedRef.current = replayFinished;
    streamControllerRef.current?.abort();
    setConnection("reconnecting");
    setReconnectVersion((value) => value + 1);
  }, []);

  const handleReconnect = useCallback(() => requestRejoin(true), [requestRejoin]);

  useEffect(() => {
    if (!chatId || !user?.email) return;
    const replayFinished = replayFinishedRef.current;
    const controller = new AbortController();
    streamControllerRef.current = controller;
    getRunStatus(chatId).then((status) => {
      if (controller.signal.aborted) return;
      if (!status.active && !replayFinished) {
        clearRun();
        void queryClient.refetchQueries({ queryKey: ["chat-messages", chatId] });
        return;
      }
      setIsStreaming(true);
      // Manual reconnect also replays a just-finished run: its terminal error
      // or completion may have arrived while this client was disconnected.
      // Replay retained events to recover reasoning/checklist and partial text.
      // This follows existing work; it never starts another paid turn.
      return followRun(chatId, handlersRef.current(controller), { signal: controller.signal });
    }).catch(() => {
      if (!controller.signal.aborted) {
        setIsStreaming(true);
        setConnection("interrupted");
      }
    });
    return () => {
      controller.abort();
      streamControllerRef.current?.abort();
    };
  }, [chatId, user?.email, canvasKey, branchId, reconnectVersion, clearRun, queryClient]);

  const handleStop = useCallback(async () => {
    if (!user?.email || !chatId || connection === "stopping") return;
    const controller = streamControllerRef.current;
    setConnection("stopping");
    try {
      await cancelRun(chatId);
      if (controller?.signal.aborted) return;
      controller?.abort();
      clearRun();
      void queryClient.refetchQueries({ queryKey: ["chat-messages", chatId, branchId] });
      void queryClient.invalidateQueries({ queryKey: deliverablesKey });
    } catch (error) {
      if (controller?.signal.aborted) return;
      setConnection("interrupted");
      toast({ title: "Could not stop the run", description: error instanceof Error ? error.message : "Try again.", variant: "destructive" });
    }
  }, [user?.email, chatId, branchId, connection, clearRun, queryClient, deliverablesKey, toast]);

  const handleSend = useCallback(async (message: string, files?: File[], meta?: ChatSendMeta) => {
    if (!user?.email || !chatId || isStreaming) return;
    streamControllerRef.current?.abort();
    const controller = new AbortController();
    streamControllerRef.current = controller;
    clearRun();
    setRunError(null);
    lastSentRef.current = message;
    setOptimisticMessages([{ message_id: `temp-${Date.now()}`, role: "user", content: message, timestamp: new Date().toISOString() }]);
    setIsStreaming(true);
    const rewindToMessageId = rewindTargetId ?? undefined;
    cancelRewind();
    try {
      await runTurn({
        chatId, message, mode: "campaign", branchId, rewindToMessageId,
        activeTaskId: taskId, files, referenceAssetIds: selectedAssetIds,
        generationMode: meta?.generationMode, generationOptions: meta?.generationOptions,
        tier: meta?.tier ?? tier,
      }, handlersRef.current(controller), controller.signal);
    } catch (error) {
      if (controller.signal.aborted) return;
      clearRun();
      setRunError(error instanceof Error ? error.message : "Could not send the message.");
      reportSendFailure(error, { toast, chatId, userEmail: user?.email });
      // A conflict or lost acknowledgement may mean work was accepted. Check
      // active work only; a confirmed rejected start must retain its own error.
      if (error instanceof ChatBusyError || error instanceof TypeError) requestRejoin(false);
    }
  }, [user?.email, chatId, isStreaming, clearRun, branchId, rewindTargetId, cancelRewind, taskId, selectedAssetIds, tier, toast, requestRejoin]);

  const canvasContextValue = useMemo<CanvasContextValue | null>(() => {
    if (!chatId || !user?.email) return null;
    if (!isCampaignCanvas && !task) return null;
    return {
      userEmail: user.email,
      task: task ?? null,
      objects,
      chatId,
      canvasKey,
      campaignId,
      messages,
      threadAssets: messagesData?.assets ?? [],
      streamingAssets,
      streamingContent,
      isStreaming,
      updateMessage,
      thinkingText,
      steps,
      connection,
      onReconnect: handleReconnect,
      runError,
      onRetry: () => { chatInputRef.current?.setDraft(lastSentRef.current || messages.filter((m) => m.role === "user").at(-1)?.content || ""); setRunError(null); },
      onSend: handleSend,
      onStop: handleStop,
      chatInputRef,
      onRewind: armRewind,
      rewindingFromId: rewindTargetId,
      rewindReplacingCount: rewindReplacingCount,
      onCancelRewind: cancelRewind,
      onApprove: handleApprove,
      approvingIds,
      referenceCount: selectedAssetIds.length,
      tier,
      onTierChange: setTier,
    };
  }, [
    isCampaignCanvas,
    task,
    objects,
    chatId,
    tier,
    canvasKey,
    campaignId,
    user,
    messages,
    messagesData?.assets,
    streamingAssets,
    streamingContent,
    isStreaming,
    updateMessage,
    thinkingText,
    steps,
    connection,
    handleReconnect,
    runError,
    handleSend,
    handleStop,
    armRewind,
    rewindTargetId,
    rewindReplacingCount,
    cancelRewind,
    handleApprove,
    approvingIds,
    selectedAssetIds.length,
  ]);

  if (isLoading && !isCampaignCanvas) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if ((!isCampaignCanvas && (error || !task)) || !canvasContextValue) {
    return (
      <div className="h-full p-6 flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">Failed to load this canvas</p>
        <Button variant="outline" onClick={handleBackToCreative}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Creative
        </Button>
      </div>
    );
  }

  return (
    <CanvasContext.Provider value={canvasContextValue}>
      <div className="h-full flex overflow-hidden">
        {leftCollapsed ? (
          <div className="flex h-full w-10 shrink-0 flex-col items-center border-r border-border bg-card/40 py-2">
            <button
              type="button"
              onClick={() => setLeftCollapsed(false)}
              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Expand panel"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <CanvasLeftPane
            campaignId={campaignId}
            chatId={chatId!}
            campaignTitle={chatData?.title || task?.title || "Campaign"}
            onCollapse={() => setLeftCollapsed(true)}
          />
        )}

        <div className="relative flex-1 min-w-0">
          <div className="absolute top-3 left-3 z-10">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBackToCreative}
              className="shadow-md border border-border"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>

          <CanvasWorkspace
            objects={objects}
            keyVisual={keyVisual}
            fixturePositions={fixturePositions}
            onFixtureMoved={handleFixtureMoved}
            onChatResized={handleChatResized}
            onObjectMoved={handleObjectMoved}
            onObjectResized={handleObjectResized}
            onSelectionChange={setSelectedAssetIds}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <CanvasSwitcher
              chatId={chatId!}
              campaignId={campaignId}
              currentTaskId={taskId}
              currentTitle={task?.title ?? canvasTitle}
            />
          </div>
        </div>
      </div>
    </CanvasContext.Provider>
  );
}
