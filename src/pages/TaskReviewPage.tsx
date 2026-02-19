import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { Loader2, ArrowLeft, ChevronLeft, ChevronRight, Download, FileText, Image, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCampaignTask, getCampaignTaskAssets, patchCampaignTask, refreshAssetUrls } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils";
import type { Asset } from "@/types/api";
import type { CampaignTaskStatus } from "@/types/api";

const statusConfig: Record<CampaignTaskStatus, { label: string; className: string }> = {
  todo: { label: 'To do', className: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'In progress', className: 'bg-primary/20 text-primary' },
  under_review: { label: 'Under review', className: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' },
  done: { label: 'Done', className: 'bg-green-500/20 text-green-600 dark:text-green-400' },
};

function isImageOrVideo(asset: Asset): boolean {
  return asset.mime_type.startsWith('image/') || asset.mime_type.startsWith('video/');
}

export default function TaskReviewPage() {
  const { chatId, taskId } = useParams<{ chatId: string; taskId: string }>();
  const navigate = useNavigate();
  const outletContext = useOutletContext<{
    setActiveTab?: (tab: string) => void;
    setSelectedTaskId?: (id: string | null) => void;
  }>();
  const setActiveTab = outletContext?.setActiveTab ?? (() => {});
  const setSelectedTaskId = outletContext?.setSelectedTaskId ?? (() => {});

  const [previewIndex, setPreviewIndex] = useState(0);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: task, isLoading: taskLoading, error: taskError } = useQuery({
    queryKey: ['campaign-task', taskId, user?.email],
    queryFn: () => getCampaignTask(taskId!, user!.email!),
    enabled: !!taskId && !!user?.email,
  });

  const { data: assetsData } = useQuery({
    queryKey: ['campaign-task-assets', taskId, user?.email],
    queryFn: () => getCampaignTaskAssets(taskId!, user!.email!),
    enabled: !!taskId && !!user?.email,
  });

  const assets = assetsData?.assets ?? [];
  const previewAssets = assets.filter(isImageOrVideo);
  const currentPreview = previewAssets[previewIndex] ?? null;

  useEffect(() => {
    if (taskId) setSelectedTaskId(taskId);
    return () => setSelectedTaskId(null);
  }, [taskId, setSelectedTaskId]);

  useEffect(() => {
    setPreviewIndex(0);
  }, [taskId]);

  const handleBackToTask = () => {
    navigate(`/app/chat/${chatId}/task/${taskId}`);
  };

  const handleMarkComplete = async () => {
    if (!user?.email || !taskId || task?.status === 'done') return;
    try {
      await patchCampaignTask(taskId, user.email, { status: 'done' });
      queryClient.invalidateQueries({ queryKey: ['campaign-task', taskId, user.email] });
      queryClient.invalidateQueries({ queryKey: ['campaign', task?.campaign_id, 'tasks', user.email] });
      setActiveTab('creative');
      navigate(`/app/chat/${chatId}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownload = useCallback(
    async (asset: Asset) => {
      if (!user?.email) return;
      try {
        const result = await refreshAssetUrls(asset.id, user.email);
        window.open(result.download_url, '_blank');
      } catch {
        window.open(asset.download_url, '_blank');
      }
    },
    [user?.email]
  );

  if (taskLoading || !task) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (taskError) {
    return (
      <div className="min-h-full p-6 flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">Failed to load task</p>
        <Button variant="outline" onClick={handleBackToTask}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Task
        </Button>
      </div>
    );
  }

  const status = statusConfig[task.status];
  const hasBodyCopy = !!task.body_copy?.trim();
  const hasPreview = previewAssets.length > 0;
  const hasDownloads = assets.length > 0;
  const showMarkComplete = task.status !== 'done';

  return (
    <div className="min-h-full p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBackToTask} className="shrink-0">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Task
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">{task.title}</h1>
          <span
            className={cn(
              "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
              status.className
            )}
          >
            {status.label}
          </span>
        </div>

        {/* Top row: Body copy (left) and Image/Video preview (right), 50/50 or full width */}
        <div
          className={cn(
            "grid gap-6",
            hasBodyCopy && hasPreview ? "grid-cols-2" : "grid-cols-1"
          )}
        >
          {hasBodyCopy && (
            <section className="min-w-0">
              <h2 className="text-sm font-medium text-muted-foreground mb-2">Body copy</h2>
              <div className="rounded-lg border border-border bg-card p-4">
                <Markdown>{task.body_copy}</Markdown>
              </div>
            </section>
          )}

          {hasPreview && (
            <section className="min-w-0">
              <h2 className="text-sm font-medium text-muted-foreground mb-2">Image / video preview</h2>
              <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col items-center justify-center min-h-[280px] relative">
                {currentPreview?.mime_type.startsWith('video/') ? (
                  <video
                    key={currentPreview.id}
                    src={currentPreview.view_url}
                    controls
                    className="max-w-full max-h-[400px]"
                  />
                ) : (
                  <img
                    key={currentPreview?.id}
                    src={currentPreview?.view_url ?? ''}
                    alt={currentPreview?.file_name ?? ''}
                    className="max-w-full max-h-[400px] object-contain"
                  />
                )}
                {previewAssets.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2"
                      disabled={previewIndex <= 0}
                      onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      disabled={previewIndex >= previewAssets.length - 1}
                      onClick={() => setPreviewIndex((i) => Math.min(previewAssets.length - 1, i + 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Download cards - all assets */}
        {hasDownloads && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Downloads</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => handleDownload(asset)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border border-border bg-card p-3",
                    "hover:bg-muted/50 transition-colors text-left"
                  )}
                >
                  {asset.mime_type.startsWith('image/') ? (
                    <Image className="h-8 w-8 shrink-0 text-muted-foreground" />
                  ) : asset.mime_type.startsWith('video/') ? (
                    <Video className="h-8 w-8 shrink-0 text-muted-foreground" />
                  ) : (
                    <FileText className="h-8 w-8 shrink-0 text-muted-foreground" />
                  )}
                  <span className="text-sm truncate flex-1 min-w-0" title={asset.file_name}>
                    {asset.file_name}
                  </span>
                  <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Footer actions */}
        <div className="flex flex-wrap gap-3 pt-4">
          <Button variant="outline" onClick={handleBackToTask}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Task Details
          </Button>
          {showMarkComplete && (
            <Button onClick={handleMarkComplete}>
              Mark as Complete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
