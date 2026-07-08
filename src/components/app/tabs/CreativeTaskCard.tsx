import { Link } from "react-router-dom";
import { FileText, Image, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CampaignTask, CampaignTaskStatus } from "@/types/api";

interface CreativeTaskCardProps {
  task: CampaignTask;
  chatId: string;
}

const statusConfig: Record<CampaignTaskStatus, { label: string; className: string }> = {
  todo: { label: 'To do', className: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'In progress', className: 'bg-primary/20 text-primary' },
  under_review: { label: 'Under review', className: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' },
  done: { label: 'Done', className: 'bg-green-500/20 text-green-600 dark:text-green-400' },
};

function CategoryIcon({ category }: { category: string | null }) {
  const cat = (category || "").toLowerCase();
  if (cat.includes("image")) {
    return <Image className="h-4 w-4 shrink-0" />;
  }
  if (cat.includes("video")) {
    return <Video className="h-4 w-4 shrink-0" />;
  }
  return <FileText className="h-4 w-4 shrink-0" />;
}

export function CreativeTaskCard({ task, chatId }: CreativeTaskCardProps) {
  const status = statusConfig[task.status];
  const categoryLabel = task.category?.replace(/_/g, " ") || "task";

  return (
    <Link
      to={`/app/chat/${chatId}/task/${task.id}`}
      className={cn(
        "flex flex-col rounded-lg border border-border bg-card p-4 min-w-0 overflow-hidden",
        "transition-colors hover:bg-muted/50 h-full"
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="shrink-0 text-muted-foreground">
          <CategoryIcon category={task.category} />
        </div>
        <p
          className="font-medium text-foreground line-clamp-3 break-words min-h-0"
          title={task.title}
        >
          {task.title}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-auto">
        <span
          className={cn(
            "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
            status.className
          )}
        >
          {status.label}
        </span>
        <span className="text-xs text-muted-foreground capitalize">{categoryLabel}</span>
      </div>
    </Link>
  );
}
