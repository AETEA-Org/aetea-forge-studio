import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Tag, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskModel } from "@/types/api";

interface TaskModalProps {
  task: TaskModel | null;
  open: boolean;
  onClose: () => void;
}

const categoryColors: Record<string, string> = {
  short_form_video: 'bg-purple-500/10 text-purple-500',
  image: 'bg-blue-500/10 text-blue-500',
  music: 'bg-pink-500/10 text-pink-500',
  copywriting: 'bg-green-500/10 text-green-500',
  strategy: 'bg-orange-500/10 text-orange-500',
  default: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  under_review: 'Under Review',
  done: 'Done',
};

export function TaskModal({ task, open, onClose }: TaskModalProps) {
  if (!task) return null;

  const categoryColor = categoryColors[task.category] || categoryColors.default;
  
  // Simple markdown cleanup
  const cleanTitle = task.title_markdown
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '');
  
  const cleanDescription = task.description_markdown
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg pr-8">{cleanTitle}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Meta */}
          <div className="flex flex-wrap gap-2">
            <span className={cn("text-xs px-2 py-1 rounded", categoryColor)}>
              {task.category.replace(/_/g, ' ')}
            </span>
            <span className="text-xs px-2 py-1 rounded bg-muted">
              {statusLabels[task.status]}
            </span>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {cleanDescription}
            </p>
          </div>

          {/* Deadline */}
          {task.deadline && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Deadline: {task.deadline}</span>
            </div>
          )}

          {/* Deliverables */}
          {task.deliverables && task.deliverables.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Deliverables</p>
              </div>
              <ul className="space-y-1">
                {task.deliverables.map((item, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action */}
          <div className="pt-4 border-t border-border">
            <Button disabled className="w-full">
              Complete Task — Coming Soon
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
