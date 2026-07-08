import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import {
  Loader2,
  ArrowLeft,
  FileText,
  Image,
  Video,
  ListChecks,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCampaignTask,
  getCampaignTaskDeliverables,
  sendChatMessage,
  resolveStreamAssetHints,
} from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useModification } from "@/hooks/useModification";
import { useToast } from "@/hooks/use-toast";
import { Markdown } from "@/components/ui/markdown";
import { ModificationOverlay } from "@/components/app/ModificationOverlay";
import { ChatMessages } from "@/components/app/ChatMessages";
import { ChatInput, type ChatInputHandle } from "@/components/app/ChatInput";
import { ChatPanelDropZone } from "@/components/app/ChatPanelDropZone";
import { useChatMessages } from "@/hooks/useChats";
import { cn } from "@/lib/utils";
import type {
  CampaignTaskStatus,
  ChatMessage,
  ChatRenderableAsset,
  DeliverableObject,
  StreamAssetHint,
} from "@/types/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const statusConfig: Record<CampaignTaskStatus, { label: string; className: string }> = {
  todo: { label: 'To do', className: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'In progress', className: 'bg-primary/20 text-primary' },
  under_review: { label: 'Under review', className: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' },
  done: { label: 'Done', className: 'bg-green-500/20 text-green-600 dark:text-green-400' },
};

function CategoryIcon({ category }: { category: string | null }) {
  const cat = (category || "").toLowerCase();
  if (cat.includes("image")) return <Image className="h-4 w-4 shrink-0" />;
  if (cat.includes("video")) return <Video className="h-4 w-4 shrink-0" />;
  return <FileText className="h-4 w-4 shrink-0" />;
}

function DeliverableObjectPreview({ obj }: { obj: DeliverableObject }) {
  const url = obj.view_url || obj.download_url || "";
  const isVideo =
    obj.object_type === "video" || obj.mime_type?.toLowerCase().startsWith("video/");
  const isImage =
    obj.object_type === "image" || obj.mime_type?.toLowerCase().startsWith("image/");
  const label = obj.title?.trim() || obj.file_name || obj.object_type;

  if (isImage && url) {
    return (
      <img
        src={url}
        alt={label}
        className="max-w-full max-h-[280px] object-contain rounded-md"
      />
    );
  }
  if (isVideo && url) {
    return (
      <video src={url} controls className="max-w-full max-h-[280px] rounded-md" />
    );
  }
  return (
    <div className="flex items-start gap-3 min-w-0">
      <FileText className="h-10 w-10 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="font-medium text-sm">{obj.file_name || label}</p>
        {obj.description && (
          <p className="text-sm text-muted-foreground mt-1">{obj.description}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-2">
          {obj.view_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={obj.view_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </a>
            </Button>
          )}
          {obj.download_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={obj.download_url} download={obj.file_name || true}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TaskDetailPage() {
  const { chatId, taskId } = useParams<{ chatId: string; taskId: string }>();
  const navigate = useNavigate();
  const outletContext = useOutletContext<{
    isModifying?: boolean;
    setActiveTab?: (tab: string) => void;
    setSelectedTaskId?: (id: string | null) => void;
  }>();
  const isModifying = outletContext?.isModifying ?? false;
  const setActiveTab = outletContext?.setActiveTab ?? (() => {});
  const setSelectedTaskId = outletContext?.setSelectedTaskId ?? (() => {});

  const { user } = useAuth();
  const { setIsModifying } = useModification();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const branchId = taskId ? `task:${taskId}` : "main";

  const [streamingContent, setStreamingContent] = useState("");
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
  const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(true);
  const [deliverablesOpen, setDeliverablesOpen] = useState(false);
  const [streamingAssets, setStreamingAssets] = useState<ChatRenderableAsset[]>([]);
  const chatInputRef = useRef<ChatInputHandle>(null);

  const { data: task, isLoading, error, refetch } = useQuery({
    queryKey: ['campaign-task', taskId, user?.email],
    queryFn: () => getCampaignTask(taskId!, user!.email!),
    enabled: !!taskId && !!user?.email,
  });
  const { data: messagesData } = useChatMessages(chatId, branchId);
  const serverMessages: ChatMessage[] = messagesData?.messages ?? [];
  const messages = [...serverMessages, ...optimisticMessages];

  const { data: deliverablesData, isLoading: deliverablesLoading } = useQuery({
    queryKey: ['campaign-task-deliverable-objects', taskId, user?.email],
    queryFn: () => getCampaignTaskDeliverables(taskId!, user!.email!),
    enabled: deliverablesOpen && !!taskId && !!user?.email,
  });

  const deliverableObjects = useMemo<DeliverableObject[]>(() => {
    return deliverablesData?.objects ?? [];
  }, [deliverablesData]);

  useEffect(() => {
    if (taskId) setSelectedTaskId(taskId);
    return () => setSelectedTaskId(null);
  }, [taskId, setSelectedTaskId]);

  const handleBackToCreative = useCallback(() => {
    setActiveTab('creative');
    navigate(`/app/chat/${chatId}`);
  }, [chatId, navigate, setActiveTab]);

  const mergeStreamAssets = useCallback(async (hints: StreamAssetHint[]) => {
    if (!user?.email || hints.length === 0) return;
    const resolved = await resolveStreamAssetHints(user.email, hints);
    setStreamingAssets((prev) => {
      const m = new Map(prev.map((a) => [a.id, a]));
      resolved.forEach((a) => m.set(a.id, a));
      return Array.from(m.values());
    });
  }, [user?.email]);

  const handleSendTaskMessage = useCallback(async (message: string, files?: File[]) => {
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
            queryClient.invalidateQueries({ queryKey: ['campaign-task', taskId, user.email] });
            queryClient.invalidateQueries({ queryKey: ['campaign-task-deliverable-objects', taskId, user.email] });
          }
        },
        (hints: StreamAssetHint[]) => {
          mergeStreamAssets(hints).catch(() => {});
        },
        async () => {
          await queryClient.refetchQueries({ queryKey: ['chat-messages', chatId, branchId] });
          queryClient.invalidateQueries({ queryKey: ['campaign-task', taskId, user.email] });
          queryClient.invalidateQueries({ queryKey: ['campaign-task-deliverable-objects', taskId, user.email] });
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
          toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
        },
        branchId
      );
    } catch (e) {
      setIsModifying(false, null);
      setStreamingContent("");
      setStreamingAssets([]);
      setUpdateMessage(null);
      setOptimisticMessages([]);
      setIsStreaming(false);
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to send task message',
        variant: 'destructive',
      });
    }
  }, [branchId, chatId, isStreaming, mergeStreamAssets, queryClient, setIsModifying, taskId, toast, user?.email]);

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (error || !task) {
    return (
      <div className="min-h-full p-6 flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">Failed to load task</p>
        <Button variant="outline" onClick={handleBackToCreative}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Creative
        </Button>
      </div>
    );
  }

  const status = statusConfig[task.status];
  const taskDeadline = task.deadline ? new Date(task.deadline).toLocaleDateString() : null;
  const categoryLabel = task.category?.replace(/_/g, " ") || "task";

  return (
    <div className={cn("relative min-h-full p-6 md:p-8 flex flex-col", isModifying && "pointer-events-none")}>
      <ModificationOverlay isActive={isModifying} message="AETEA is modifying campaign..." />
      <div className="max-w-6xl mx-auto w-full flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between gap-4 mb-4 sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 py-2 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="sm" onClick={handleBackToCreative} className="shrink-0">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-lg font-semibold truncate">{task.title}</h1>
            <span
              className={cn(
                "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                status.className
              )}
            >
              {status.label}
            </span>
          </div>
          <Button onClick={() => setDeliverablesOpen(true)} size="sm" className="shrink-0">
            <ListChecks className="h-4 w-4 mr-2" />
            View Task Deliverables
          </Button>
        </div>

        <div className="mb-3 rounded-xl border border-border/60 bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/40">
          <button
            className="w-full flex items-center justify-between px-4 py-2.5 text-left"
            onClick={() => setIsDetailsCollapsed((prev) => !prev)}
            type="button"
          >
            <span className="text-sm font-medium">Task Details</span>
            {isDetailsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          {!isDetailsCollapsed && (
            <div className="px-4 pb-4 space-y-3 border-t border-border/60">
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CategoryIcon category={task.category} />
                  <span className="text-sm capitalize">{categoryLabel}</span>
                </div>
                {taskDeadline && (
                  <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                    Deadline: {taskDeadline}
                  </span>
                )}
              </div>
              {task.description ? (
                <section className="prose prose-sm dark:prose-invert max-w-none">
                  <Markdown className="text-foreground">{task.description}</Markdown>
                </section>
              ) : (
                <p className="text-sm text-muted-foreground">No description provided.</p>
              )}
            </div>
          )}
        </div>

        <ChatPanelDropZone
          className="flex-1 min-h-0"
          disabled={isStreaming}
          onFilesDropped={(files) => chatInputRef.current?.addFiles(files)}
        >
          <div className="flex-1 min-h-0">
            <ChatMessages
              messages={messages}
              threadAssets={messagesData?.assets ?? []}
              streamingAssets={streamingAssets}
              streamingContent={streamingContent}
              isStreaming={isStreaming}
              updateMessage={updateMessage}
              showEmptyState={false}
            />
          </div>
          <div className="px-2 md:px-4 pb-2 md:pb-4">
            <div className="max-w-4xl mx-auto">
              <ChatInput
                ref={chatInputRef}
                onSend={handleSendTaskMessage}
                isStreaming={isStreaming}
                contextLabel="Task Execution"
                inputPlaceholder="Describe what to generate or refine for this task..."
                textareaMaxHeight={180}
                variant="floating"
              />
            </div>
          </div>
        </ChatPanelDropZone>
      </div>

      <Dialog open={deliverablesOpen} onOpenChange={setDeliverablesOpen}>
        <DialogContent className="max-w-5xl w-[calc(100vw-2rem)] max-h-[90vh] overflow-hidden flex flex-col gap-0 sm:max-h-[85vh] min-w-0">
          <DialogHeader className="shrink-0 pr-10">
            <DialogTitle>Task Deliverables</DialogTitle>
            <DialogDescription>
              Browse generated deliverables for this task.
            </DialogDescription>
          </DialogHeader>

          {deliverablesLoading ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : deliverableObjects.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No deliverable objects yet.
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto max-h-[min(520px,70vh)] pr-1">
              {deliverableObjects.map((obj) => (
                <div
                  key={obj.id}
                  className="rounded-lg border border-border p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm">
                      {obj.title?.trim() || obj.file_name || obj.object_type}
                    </p>
                    <span className="text-xs uppercase text-muted-foreground">
                      {obj.object_type}
                    </span>
                  </div>
                  <DeliverableObjectPreview obj={obj} />
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
