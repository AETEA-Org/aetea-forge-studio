import { useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { Loader2, ArrowLeft, FileText, Image, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCampaignTask, sendChatMessage } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useModification } from "@/hooks/useModification";
import { useToast } from "@/hooks/use-toast";
import { Markdown } from "@/components/ui/markdown";
import { ModificationOverlay } from "@/components/app/ModificationOverlay";
import { cn } from "@/lib/utils";
import type { CampaignTaskStatus, CampaignTaskType } from "@/types/api";

const statusConfig: Record<CampaignTaskStatus, { label: string; className: string }> = {
  todo: { label: 'To do', className: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'In progress', className: 'bg-primary/20 text-primary' },
  under_review: { label: 'Under review', className: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' },
  done: { label: 'Done', className: 'bg-green-500/20 text-green-600 dark:text-green-400' },
};

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

  const { data: task, isLoading, error, refetch } = useQuery({
    queryKey: ['campaign-task', taskId, user?.email],
    queryFn: () => getCampaignTask(taskId!, user!.email!),
    enabled: !!taskId && !!user?.email,
  });

  useEffect(() => {
    if (taskId) setSelectedTaskId(taskId);
    return () => setSelectedTaskId(null);
  }, [taskId, setSelectedTaskId]);

  const handleBackToCreative = () => {
    setActiveTab('creative');
    navigate(`/app/chat/${chatId}`);
  };

  const handleSeeCompletedTask = () => {
    navigate(`/app/chat/${chatId}/task/${taskId}/review`);
  };

  const handleCompleteTask = async () => {
    if (!user?.email || !chatId || !taskId || task?.status !== 'todo') return;
    setIsModifying(true, 'creative');
    try {
      await sendChatMessage(
        user.email,
        chatId,
        'Complete task',
        'campaign',
        `task:${taskId}`,
        undefined,
        () => {},
        () => {},
        (eventName: string) => {
          if (eventName === 'campaign_modified') {
            queryClient.invalidateQueries({ queryKey: ['campaign-task', taskId, user.email] });
            refetch();
          }
        },
        () => {
          setIsModifying(false, null);
          refetch().then(({ data }) => {
            if (data?.status === 'todo') {
              toast({
                title: 'Task could not be completed',
                description: 'AETEA could not complete task. Please try again.',
                variant: 'destructive',
              });
            }
          });
        },
        (msg: string) => {
          setIsModifying(false, null);
          toast({ title: 'Error', description: msg, variant: 'destructive' });
        }
      );
    } catch (e) {
      setIsModifying(false, null);
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to complete task',
        variant: 'destructive',
      });
    }
  };

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
  const showCompleteButton = task.status === 'todo';

  return (
    <div className={cn("relative min-h-full p-6 md:p-8", isModifying && "pointer-events-none")}>
      <ModificationOverlay isActive={isModifying} message="AETEA is modifying campaign..." />

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBackToCreative} className="shrink-0">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Creative
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TypeIcon type={task.type} />
            <span className="text-sm capitalize">{task.type}</span>
            {task.subtype && (
              <span className="text-sm">
                · {task.subtype.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
            )}
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
              status.className
            )}
          >
            {status.label}
          </span>
        </div>

        <h1 className="text-2xl font-semibold">{task.title}</h1>

        {task.description && (
          <section className="prose prose-sm dark:prose-invert max-w-none">
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Description</h2>
            <Markdown className="text-foreground">{task.description}</Markdown>
          </section>
        )}

        <div className="pt-4">
          {showCompleteButton ? (
            <Button onClick={handleCompleteTask} disabled={isModifying} size="lg">
              {isModifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Completing task...
                </>
              ) : (
                'Complete Task'
              )}
            </Button>
          ) : (
            <Button onClick={handleSeeCompletedTask} size="lg">
              See completed task
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
