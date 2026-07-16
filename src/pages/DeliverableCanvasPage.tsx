import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { ArrowLeft, Loader2, PanelLeftOpen } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  getChat,
  getCampaignTask,
  getCampaignTaskDeliverables,
  sendChatMessage,
  resolveStreamAssetHints,
  patchDeliverableObjectPosition,
  approveDeliverableObject,
  refreshAssetUrls,
} from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useModification } from "@/hooks/useModification";
import { useToast } from "@/hooks/use-toast";
import { useChatMessages } from "@/hooks/useChats";
import { useCreativeState } from "@/hooks/useCreativeState";
import { ModificationOverlay } from "@/components/app/ModificationOverlay";
import type { ChatInputHandle, ChatSendMeta } from "@/components/app/ChatInput";
import type {
  ChatMessage,
  ChatRenderableAsset,
  DeliverableObject,
  StreamAssetHint,
} from "@/types/api";
import { cn } from "@/lib/utils";
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
    isModifying?: boolean;
    setActiveTab?: (tab: string) => void;
    setSelectedTaskId?: (id: string | null) => void;
  }>();
  const isModifying = outletContext?.isModifying ?? false;
  const setActiveTab = outletContext?.setActiveTab;
  const setSelectedTaskId = outletContext?.setSelectedTaskId;

  const { user } = useAuth();
  const { setIsModifying } = useModification();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const branchId = taskId ? `task:${taskId}` : "main";

  const [streamingContent, setStreamingContent] = useState("");
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
  const [streamingAssets, setStreamingAssets] = useState<ChatRenderableAsset[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [fixturePositions, setFixturePositions] = useState<FixturePositions>(() =>
    loadFixturePositions(taskId ?? "")
  );
  const chatInputRef = useRef<ChatInputHandle>(null);
  const placedRef = useRef<Set<string>>(new Set());

  const { data: chatData } = useQuery({
    queryKey: ["chat", chatId, user?.email],
    queryFn: () => getChat(chatId!, user!.email!),
    enabled: !!chatId && !!user?.email,
  });
  const campaignId = chatData?.campaign_id ?? undefined;

  const { data: creativeState } = useCreativeState(campaignId);
  const keyVisualAssetId = creativeState?.key_visual_asset_id ?? null;
  const { data: keyVisualUrl } = useQuery({
    queryKey: ["asset-urls", keyVisualAssetId, user?.email],
    queryFn: () =>
      refreshAssetUrls(keyVisualAssetId!, user!.email!).then((r) => r.download_url),
    enabled: !!keyVisualAssetId && !!user?.email,
    staleTime: 50 * 60 * 1000,
  });
  const keyVisual: KeyVisualProp =
    keyVisualAssetId && keyVisualUrl
      ? { assetId: keyVisualAssetId, downloadUrl: keyVisualUrl }
      : null;

  const { data: task, isLoading, error } = useQuery({
    queryKey: ["campaign-task", taskId, user?.email],
    queryFn: () => getCampaignTask(taskId!, user!.email!),
    enabled: !!taskId && !!user?.email,
  });

  const { data: messagesData } = useChatMessages(chatId, branchId);
  const messages = useMemo<ChatMessage[]>(
    () => [...(messagesData?.messages ?? []), ...optimisticMessages],
    [messagesData?.messages, optimisticMessages]
  );

  const { data: deliverablesData } = useQuery({
    queryKey: ["campaign-task-deliverable-objects", taskId, user?.email],
    queryFn: () => getCampaignTaskDeliverables(taskId!, user!.email!),
    enabled: !!taskId && !!user?.email,
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
  useEffect(() => {
    setSelectedAssetIds([]);
    setFixturePositions(loadFixturePositions(taskId ?? ""));
    placedRef.current = new Set();
  }, [taskId]);

  // Give unplaced objects a grid slot and persist it so layout survives reloads.
  useEffect(() => {
    if (!taskId || !user?.email) return;
    objects.forEach((obj, index) => {
      const needsPlacement = obj.canvas_x == null || obj.canvas_y == null;
      if (!needsPlacement || placedRef.current.has(obj.id)) return;
      placedRef.current.add(obj.id);
      const pos = autoObjectPosition(index);
      patchDeliverableObjectPosition(taskId, obj.id, user.email, {
        canvas_x: pos.x,
        canvas_y: pos.y,
      }).catch(() => {
        placedRef.current.delete(obj.id);
      });
    });
  }, [objects, taskId, user?.email]);

  const handleBackToCreative = useCallback(() => {
    setActiveTab?.("creative");
    navigate(`/app/chat/${chatId}`);
  }, [chatId, navigate, setActiveTab]);

  const handleFixtureMoved = useCallback(
    (which: keyof FixturePositions, pos: XY) => {
      setFixturePositions((prev) => {
        const next = { ...prev, [which]: pos };
        if (taskId) saveFixturePositions(taskId, next);
        return next;
      });
    },
    [taskId]
  );

  const handleObjectMoved = useCallback(
    (objectId: string, pos: XY) => {
      if (!taskId || !user?.email) return;
      patchDeliverableObjectPosition(taskId, objectId, user.email, {
        canvas_x: pos.x,
        canvas_y: pos.y,
      }).catch(() => {});
    },
    [taskId, user?.email]
  );

  const handleObjectResized = useCallback(
    (objectId: string, size: { width: number; height: number }) => {
      if (!taskId || !user?.email) return;
      patchDeliverableObjectPosition(taskId, objectId, user.email, {
        canvas_width: size.width,
        canvas_height: size.height,
      }).catch(() => {});
    },
    [taskId, user?.email]
  );

  const handleApprove = useCallback(
    async (objectId: string) => {
      if (!taskId || !user?.email) return;
      setApprovingIds((prev) => new Set(prev).add(objectId));
      try {
        await approveDeliverableObject(taskId, objectId, user.email);
        await queryClient.invalidateQueries({
          queryKey: ["campaign-task-deliverable-objects", taskId, user.email],
        });
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
    [taskId, user?.email, queryClient, toast]
  );

  const mergeStreamAssets = useCallback(
    async (hints: StreamAssetHint[]) => {
      if (!user?.email || hints.length === 0) return;
      const resolved = await resolveStreamAssetHints(user.email, hints);
      setStreamingAssets((prev) => {
        const m = new Map(prev.map((a) => [a.id, a]));
        resolved.forEach((a) => m.set(a.id, a));
        return Array.from(m.values());
      });
    },
    [user?.email]
  );

  const handleSend = useCallback(
    async (message: string, files?: File[], meta?: ChatSendMeta) => {
      if (!user?.email || !chatId || !taskId || isStreaming) return;

      const optimisticMessage: ChatMessage = {
        message_id: `temp-${Date.now()}`,
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      };
      setOptimisticMessages([optimisticMessage]);
      setStreamingContent("");
      setStreamingAssets([]);
      setUpdateMessage(null);
      setIsStreaming(true);

      const refs = selectedAssetIds;

      try {
        await sendChatMessage(
          user.email,
          chatId,
          message,
          "campaign",
          `task:${taskId}`,
          files,
          (content: string) => setUpdateMessage(content),
          (content: string) => {
            setUpdateMessage(null);
            setStreamingContent(content);
          },
          (eventName: string) => {
            if (eventName === "campaign_modifying") {
              setIsModifying(true, `task:${taskId}`);
            } else if (eventName === "campaign_modified") {
              queryClient.invalidateQueries({
                queryKey: ["campaign-task", taskId, user.email],
              });
              queryClient.invalidateQueries({
                queryKey: ["campaign-task-deliverable-objects", taskId, user.email],
              });
              if (campaignId) {
                queryClient.invalidateQueries({
                  queryKey: ["creative", campaignId, user.email],
                });
              }
            }
          },
          (hints: StreamAssetHint[]) => {
            mergeStreamAssets(hints).catch(() => {});
          },
          async () => {
            await queryClient.refetchQueries({
              queryKey: ["chat-messages", chatId, branchId],
            });
            queryClient.invalidateQueries({
              queryKey: ["campaign-task", taskId, user.email],
            });
            queryClient.invalidateQueries({
              queryKey: ["campaign-task-deliverable-objects", taskId, user.email],
            });
            if (campaignId) {
              queryClient.invalidateQueries({
                queryKey: ["creative", campaignId, user.email],
              });
            }
            setIsModifying(false, null);
            setStreamingContent("");
            setStreamingAssets([]);
            setUpdateMessage(null);
            setOptimisticMessages([]);
            setIsStreaming(false);
          },
          (errorMsg: string) => {
            setIsModifying(false, null);
            setStreamingContent("");
            setStreamingAssets([]);
            setUpdateMessage(null);
            setOptimisticMessages([]);
            setIsStreaming(false);
            toast({ title: "Error", description: errorMsg, variant: "destructive" });
          },
          branchId,
          refs,
          meta?.generationMode,
          meta?.generationOptions
        );
      } catch (e) {
        setIsModifying(false, null);
        setStreamingContent("");
        setStreamingAssets([]);
        setUpdateMessage(null);
        setOptimisticMessages([]);
        setIsStreaming(false);
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : "Failed to send message",
          variant: "destructive",
        });
      }
    },
    [
      branchId,
      campaignId,
      chatId,
      isStreaming,
      mergeStreamAssets,
      queryClient,
      selectedAssetIds,
      setIsModifying,
      taskId,
      toast,
      user?.email,
    ]
  );

  const canvasContextValue = useMemo<CanvasContextValue | null>(() => {
    if (!task) return null;
    return {
      task,
      objects,
      messages,
      threadAssets: messagesData?.assets ?? [],
      streamingAssets,
      streamingContent,
      isStreaming,
      updateMessage,
      onSend: handleSend,
      chatInputRef,
      onApprove: handleApprove,
      approvingIds,
      referenceCount: selectedAssetIds.length,
    };
  }, [
    task,
    objects,
    messages,
    messagesData?.assets,
    streamingAssets,
    streamingContent,
    isStreaming,
    updateMessage,
    handleSend,
    handleApprove,
    approvingIds,
    selectedAssetIds.length,
  ]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !task || !canvasContextValue) {
    return (
      <div className="h-full p-6 flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">Failed to load task</p>
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
            campaignTitle={chatData?.title || task.title}
            onCollapse={() => setLeftCollapsed(true)}
          />
        )}

        <div className={cn("relative flex-1 min-w-0", isModifying && "pointer-events-none")}>
          <ModificationOverlay isActive={isModifying} message="AETEA is modifying campaign..." />

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
            onObjectMoved={handleObjectMoved}
            onObjectResized={handleObjectResized}
            onSelectionChange={setSelectedAssetIds}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <CanvasSwitcher
              chatId={chatId!}
              campaignId={campaignId}
              currentTaskId={taskId!}
              currentTitle={task.title}
            />
          </div>
        </div>
      </div>
    </CanvasContext.Provider>
  );
}
