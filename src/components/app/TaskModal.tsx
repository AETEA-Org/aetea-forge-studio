import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
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
  const backdropRef = useRef<HTMLDivElement>(null);
  
  // Dynamically calculate AI Copilot width and update backdrop
  useEffect(() => {
    if (!open || !backdropRef.current) return;
    
    const updateBackdropClip = () => {
      // Get ALL aside elements (there might be collapsed and expanded ones)
      const asideElements = document.querySelectorAll('aside');
      let asideWidth = 0;
      
      asideElements.forEach(aside => {
        const width = aside.getBoundingClientRect().width;
        // Use the largest aside (the expanded one)
        if (width > asideWidth) {
          asideWidth = width;
        }
      });
      
      if (asideWidth > 0 && backdropRef.current) {
        // Set the backdrop's right edge to not cover the AI Copilot
        // This actually changes the div's size, not just clips it visually
        backdropRef.current.style.right = `${asideWidth}px`;
      }
    };
    
    updateBackdropClip();
    
    // Listen for window resize
    window.addEventListener('resize', updateBackdropClip);
    
    // Also observe all aside elements for size changes (when user manually resizes)
    const asideElements = document.querySelectorAll('aside');
    let resizeObserver: ResizeObserver | null = null;
    
    if (asideElements.length > 0) {
      resizeObserver = new ResizeObserver(updateBackdropClip);
      asideElements.forEach(aside => resizeObserver!.observe(aside));
    }
    
    return () => {
      window.removeEventListener('resize', updateBackdropClip);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [open]);
  
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
    <Dialog open={open} onOpenChange={(newOpen) => !newOpen && onClose()} modal={false}>
      <DialogPortal container={document.body}>
        {/* Custom backdrop that dynamically excludes AI Copilot area */}
        <div
          ref={backdropRef}
          className="fixed top-0 bottom-0 left-0 z-40 bg-black/80"
          style={{ right: '450px' }} // Initial guess, will be updated by useEffect
          onClick={(e) => {
            // Only close if clicking the backdrop directly
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        />
        
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
          )}
          onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement;
            const closestAside = target.closest('aside');
            
            // Don't close when clicking on AI Copilot panel
            if (closestAside) {
              e.preventDefault();
            }
          }}
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement;
            const closestAside = target.closest('aside');
            
            // Don't close when clicking on AI Copilot panel
            if (closestAside) {
              e.preventDefault();
            }
          }}
        >
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity data-[state=open]:bg-accent data-[state=open]:text-muted-foreground hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
          
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
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
