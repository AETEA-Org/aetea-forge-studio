import { useState, useCallback, useRef } from "react";
import { Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { partitionChatFiles } from "@/lib/chatFileValidation";
import { useToast } from "@/hooks/use-toast";

interface ChatPanelDropZoneProps {
  children: React.ReactNode;
  /** Append validated files to the chat composer (same as choosing files via paperclip). */
  onFilesDropped: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}

function hasFilePayload(e: React.DragEvent): boolean {
  return Array.from(e.dataTransfer.types || []).includes("Files");
}

/**
 * Wraps the messages + composer column so users can drag files onto the chat area.
 * Shows a dashed overlay while a file drag is over the zone.
 */
export function ChatPanelDropZone({
  children,
  onFilesDropped,
  disabled,
  className,
}: ChatPanelDropZoneProps) {
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFileDragActive, setIsFileDragActive] = useState(false);

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      if (disabled || !hasFilePayload(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setIsFileDragActive(true);
    },
    [disabled]
  );

  const onDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      const related = e.relatedTarget as Node | null;
      const el = containerRef.current;
      if (el && related && el.contains(related)) return;
      setIsFileDragActive(false);
    },
    [disabled]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      setIsFileDragActive(false);

      if (!e.dataTransfer.files?.length) return;

      const fileArray = Array.from(e.dataTransfer.files);
      const { accepted, errors } = partitionChatFiles(fileArray);

      if (errors.length > 0) {
        toast({
          title: "Some files were skipped",
          description: errors.slice(0, 3).join(" · ") + (errors.length > 3 ? "…" : ""),
          variant: "destructive",
        });
      }

      if (accepted.length > 0) {
        onFilesDropped(accepted);
      }
    },
    [disabled, onFilesDropped, toast]
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative flex flex-1 min-h-0 min-w-0 flex-col", className)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {children}

      {isFileDragActive && !disabled && (
        <div
          className={cn(
            "pointer-events-none absolute inset-2 z-[15] flex items-center justify-center rounded-xl",
            "border-2 border-dashed border-primary bg-background/85 backdrop-blur-sm",
            "animate-in fade-in-0 duration-150"
          )}
          aria-hidden
        >
          <div className="flex max-w-sm flex-col items-center gap-2 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Paperclip className="h-7 w-7" />
            </div>
            <p className="text-sm font-medium text-foreground">Drop files to attach</p>
            <p className="text-xs text-muted-foreground leading-snug">
              PDF, Word, PowerPoint, and images · max 10MB each
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
