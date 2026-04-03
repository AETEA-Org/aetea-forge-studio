import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import {
  Loader2,
  ArrowLeft,
  FileText,
  Image,
  Video,
  ListChecks,
  ChevronLeft,
  ChevronRight,
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
import { ChatInput } from "@/components/app/ChatInput";
import { useChatMessages } from "@/hooks/useChats";
import { cn } from "@/lib/utils";
import type {
  CampaignTaskStatus,
  CampaignTaskType,
  ChatMessage,
  ChatRenderableAsset,
  DeliverableComponent,
  DeliverableItem,
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

function classifyDeliverableComponent(c: DeliverableComponent): "media" | "text" | "pdf" | "other" {
  const t = (c.component_type || "").toLowerCase();
  const m = (c.mime_type || "").toLowerCase();
  if (t === "pdf" || m === "application/pdf") return "pdf";
  if (t === "image" || t === "video" || m.startsWith("image/") || m.startsWith("video/")) return "media";
  if (t === "text") {
    return c.text_content?.trim() ? "text" : "other";
  }
  if (c.text_content?.trim()) return "text";
  return "other";
}

function partitionDeliverableComponents(components: DeliverableComponent[]) {
  let media: DeliverableComponent | undefined;
  let text: DeliverableComponent | undefined;
  let pdf: DeliverableComponent | undefined;
  const other: DeliverableComponent[] = [];
  for (const c of components) {
    const kind = classifyDeliverableComponent(c);
    if (kind === "pdf") {
      if (!pdf) pdf = c;
      else other.push(c);
    } else if (kind === "media") {
      if (!media) media = c;
      else other.push(c);
    } else if (kind === "text") {
      if (!text) text = c;
      else other.push(c);
    } else {
      other.push(c);
    }
  }
  other.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  return { media, text, pdf, other };
}

function TypeIcon({ type }: { type: CampaignTaskType }) {
  switch (type) {
    case 'text':
      return <FileText className="h-4 w-4 shrink-0" />;
    case 'image':
      return <Image className="h-4 w-4 shrink-0" />;
    case 'video':
      return <Video className="h-4 w-4 shrink-0" />;
    default:
      return <FileText className="h-4 w-4 shrink-0" />;
  }
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
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<string | null>(null);
  const [streamingAssets, setStreamingAssets] = useState<ChatRenderableAsset[]>([]);

  const { data: task, isLoading, error, refetch } = useQuery({
    queryKey: ['campaign-task', taskId, user?.email],
    queryFn: () => getCampaignTask(taskId!, user!.email!),
    enabled: !!taskId && !!user?.email,
  });
  const { data: messagesData } = useChatMessages(chatId, branchId);
  const serverMessages: ChatMessage[] = messagesData?.messages ?? [];
  const messages = [...serverMessages, ...optimisticMessages];

  const { data: deliverablesData, isLoading: deliverablesLoading } = useQuery({
    queryKey: ['campaign-task-deliverables', taskId, user?.email],
    queryFn: () => getCampaignTaskDeliverables(taskId!, user!.email!),
    enabled: deliverablesOpen && !!taskId && !!user?.email,
  });

  const deliverables = useMemo<DeliverableItem[]>(() => {
    const maybeItems = deliverablesData?.deliverables ?? deliverablesData?.items ?? [];
    return Array.isArray(maybeItems) ? maybeItems : [];
  }, [deliverablesData]);

  const selectedDeliverableIndex = deliverables.findIndex((item) => item.id === selectedDeliverableId);
  const selectedDeliverable =
    selectedDeliverableIndex >= 0 ? deliverables[selectedDeliverableIndex] : (deliverables[0] ?? null);

  useEffect(() => {
    if (!deliverablesOpen) return;
    if (!deliverables.length) {
      setSelectedDeliverableId(null);
      return;
    }
    if (!selectedDeliverableId || !deliverables.some((d) => d.id === selectedDeliverableId)) {
      setSelectedDeliverableId(deliverables[0].id);
    }
  }, [deliverablesOpen, deliverables, selectedDeliverableId]);

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
            queryClient.invalidateQueries({ queryKey: ['campaign-task-deliverables', taskId, user.email] });
          }
        },
        (hints: StreamAssetHint[]) => {
          mergeStreamAssets(hints).catch(() => {});
        },
        async () => {
          await queryClient.refetchQueries({ queryKey: ['chat-messages', chatId, branchId] });
          queryClient.invalidateQueries({ queryKey: ['campaign-task', taskId, user.email] });
          queryClient.invalidateQueries({ queryKey: ['campaign-task-deliverables', taskId, user.email] });
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
  const { media, text, pdf, other } = partitionDeliverableComponents(
    selectedDeliverable?.components ?? []
  );
  const hasPreviewContent = Boolean(
    media || pdf || other.length || text?.text_content?.trim()
  );

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
                  <TypeIcon type={task.type} />
                  <span className="text-sm capitalize">{task.type}</span>
                  {task.subtype && (
                    <span className="text-sm">
                      · {task.subtype.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  )}
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

        <div className="flex-1 min-h-0 flex flex-col">
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
                onSend={handleSendTaskMessage}
                isStreaming={isStreaming}
                contextLabel="Task Execution"
                inputPlaceholder="Describe what to generate or refine for this task..."
                textareaMaxHeight={180}
                variant="floating"
              />
            </div>
          </div>
        </div>
      </div>

      <Dialog open={deliverablesOpen} onOpenChange={setDeliverablesOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Task Deliverables</DialogTitle>
            <DialogDescription>
              Browse generated deliverables for this task.
            </DialogDescription>
          </DialogHeader>

          {deliverablesLoading ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : deliverables.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No task deliverables yet.
            </div>
          ) : (
            <div className="grid md:grid-cols-[220px_1fr] gap-4 min-h-[360px]">
              <div className="border border-border rounded-md p-2 space-y-2 overflow-y-auto max-h-[420px]">
                {deliverables.map((item, idx) => {
                  const active = selectedDeliverable?.id === item.id;
                  const itemLabel = item.title?.trim() || `Item ${item.item_index || idx + 1}`;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedDeliverableId(item.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md border transition-colors",
                        active ? "bg-primary/10 border-primary text-primary" : "bg-card border-border hover:bg-muted/50"
                      )}
                    >
                      <p className="text-sm font-medium truncate">{itemLabel}</p>
                      {item.status && (
                        <p className="text-xs text-muted-foreground mt-1 capitalize">{item.status}</p>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="border border-border rounded-md p-4 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <h3 className="font-semibold truncate">
                    {selectedDeliverable?.title?.trim() || `Item ${selectedDeliverable?.item_index ?? 1}`}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={selectedDeliverableIndex <= 0}
                      onClick={() => {
                        if (selectedDeliverableIndex <= 0) return;
                        setSelectedDeliverableId(deliverables[selectedDeliverableIndex - 1].id);
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={selectedDeliverableIndex < 0 || selectedDeliverableIndex >= deliverables.length - 1}
                      onClick={() => {
                        if (selectedDeliverableIndex < 0 || selectedDeliverableIndex >= deliverables.length - 1) return;
                        setSelectedDeliverableId(deliverables[selectedDeliverableIndex + 1].id);
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {!hasPreviewContent ? (
                  <p className="text-sm text-muted-foreground">No components in this deliverable.</p>
                ) : (
                  <div className="space-y-4 overflow-y-auto pr-1 flex flex-col min-h-0">
                    {media && (
                      <section className="min-w-0">
                        <h4 className="text-xs font-medium text-muted-foreground mb-2">Preview</h4>
                        <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col items-center justify-center min-h-[200px] p-2">
                          {(() => {
                            const url = media.view_url || media.download_url || "";
                            const isVideo =
                              media.component_type?.toLowerCase() === "video" ||
                              media.mime_type?.toLowerCase().startsWith("video/");
                            const alt = media.file_name || media.description || "Deliverable visual";
                            if (!url) {
                              return (
                                <p className="text-sm text-muted-foreground text-center px-2">
                                  Preview unavailable
                                  {media.asset_id ? ` · ${media.asset_id}` : ""}
                                </p>
                              );
                            }
                            if (isVideo) {
                              return (
                                <video
                                  key={media.id}
                                  src={url}
                                  controls
                                  className="max-w-full max-h-[400px] rounded-md"
                                />
                              );
                            }
                            return (
                              <img
                                key={media.id}
                                src={url}
                                alt={alt}
                                className="max-w-full max-h-[400px] object-contain rounded-md"
                              />
                            );
                          })()}
                        </div>
                      </section>
                    )}

                    {text?.text_content?.trim() && (
                      <section className="min-w-0">
                        <h4 className="text-xs font-medium text-muted-foreground mb-2">Copy</h4>
                        <div className="rounded-lg border border-border bg-card p-4">
                          <Markdown className="text-sm">{text.text_content}</Markdown>
                        </div>
                      </section>
                    )}

                    {pdf && (
                      <section className="min-w-0">
                        <h4 className="text-xs font-medium text-muted-foreground mb-2">Document</h4>
                        <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
                          <div className="flex items-start gap-3">
                            <FileText className="h-10 w-10 shrink-0 text-muted-foreground" aria-hidden />
                            <div className="min-w-0 flex-1 space-y-1">
                              <p className="font-medium text-sm truncate">
                                {pdf.file_name?.trim() || "PDF"}
                              </p>
                              {pdf.description?.trim() ? (
                                <p className="text-sm text-muted-foreground">{pdf.description}</p>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {pdf.view_url ? (
                              <Button variant="outline" size="sm" asChild>
                                <a href={pdf.view_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Open
                                </a>
                              </Button>
                            ) : null}
                            {pdf.download_url ? (
                              <Button variant="outline" size="sm" asChild>
                                <a href={pdf.download_url} download={pdf.file_name || true}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </a>
                              </Button>
                            ) : null}
                            {!pdf.view_url && !pdf.download_url ? (
                              <p className="text-sm text-muted-foreground">
                                Links unavailable
                                {pdf.asset_id ? ` · ${pdf.asset_id}` : ""}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </section>
                    )}

                    {other.length > 0 && (
                      <section className="min-w-0">
                        <h4 className="text-xs font-medium text-muted-foreground mb-2">Other</h4>
                        <div className="space-y-2">
                          {other.map((component) => (
                            <div
                              key={component.id}
                              className="rounded-md border border-border p-3 space-y-2"
                            >
                              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                {component.component_type}
                              </p>
                              {component.text_content?.trim() ? (
                                <Markdown className="text-sm">{component.text_content}</Markdown>
                              ) : null}
                              {component.view_url || component.download_url ? (
                                <div className="flex flex-wrap gap-2">
                                  {component.view_url ? (
                                    <Button variant="outline" size="sm" asChild>
                                      <a
                                        href={component.view_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        Open
                                      </a>
                                    </Button>
                                  ) : null}
                                  {component.download_url ? (
                                    <Button variant="outline" size="sm" asChild>
                                      <a
                                        href={component.download_url}
                                        download={component.file_name || true}
                                      >
                                        Download
                                      </a>
                                    </Button>
                                  ) : null}
                                </div>
                              ) : component.asset_id ? (
                                <p className="text-sm text-muted-foreground">
                                  Asset reference: {component.asset_id}
                                </p>
                              ) : (
                                <p className="text-sm text-muted-foreground">No preview.</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
