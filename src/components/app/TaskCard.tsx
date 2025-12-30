import { Calendar, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskModel } from "@/types/api";

interface TaskCardProps {
  task: TaskModel;
  onClick: () => void;
}

const categoryColors: Record<string, string> = {
  short_form_video: 'bg-purple-500/10 text-purple-500',
  image: 'bg-blue-500/10 text-blue-500',
  music: 'bg-pink-500/10 text-pink-500',
  copywriting: 'bg-green-500/10 text-green-500',
  strategy: 'bg-orange-500/10 text-orange-500',
  default: 'bg-muted text-muted-foreground',
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  const categoryColor = categoryColors[task.category] || categoryColors.default;
  
  // Simple markdown title cleanup (remove ** and other markdown)
  const cleanTitle = task.title_markdown
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '');

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-lg bg-card border border-border",
        "hover:border-primary/50 hover:shadow-sm transition-all",
        "focus:outline-none focus:ring-2 focus:ring-primary/20"
      )}
    >
      <p className="text-sm font-medium mb-2 line-clamp-2">{cleanTitle}</p>
      
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn("text-xs px-2 py-0.5 rounded", categoryColor)}>
          {task.category.replace(/_/g, ' ')}
        </span>
        
        {task.deadline && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {task.deadline}
          </span>
        )}
      </div>
    </button>
  );
}
