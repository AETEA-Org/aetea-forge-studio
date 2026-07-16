import { memo, useState } from "react";
import { NodeResizer, type NodeProps } from "@xyflow/react";
import { Check, Download, Eye, FileText, GripVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChatMessages } from "@/components/app/ChatMessages";
import { ChatInput } from "@/components/app/ChatInput";
import { ChatPanelDropZone } from "@/components/app/ChatPanelDropZone";
import { cn } from "@/lib/utils";
import type { CampaignTaskStatus, DeliverableObject } from "@/types/api";
import { useCanvas } from "./canvasContext";
import { ObjectViewerDialog, objectKind, useTextContent } from "./ObjectViewer";

// Resize handles reveal on hover so resizing is decoupled from selection
// (selection means "attach as chat reference", not "start resizing").
const RESIZE_LINE = "!border-primary opacity-0 group-hover:opacity-100 transition-opacity";
const RESIZE_HANDLE =
  "!bg-primary !border-background opacity-0 group-hover:opacity-100 transition-opacity";
/** Larger fixed hit area — don't shrink with zoom (autoScale=false). */
const RESIZE_HANDLE_STYLE = { width: 18, height: 18 };

const statusConfig: Record<CampaignTaskStatus, { label: string; className: string }> = {
  todo: { label: "To do", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "In progress", className: "bg-primary/20 text-primary" },
  under_review: {
    label: "Under review",
    className: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
  },
  done: {
    label: "Done",
    className: "bg-green-500/20 text-green-600 dark:text-green-400",
  },
};

/** Header used as the drag handle so inner content stays interactive. */
function CardHeader({ title, badge }: { title: string; badge?: React.ReactNode }) {
  return (
    <div className="drag-handle flex items-center gap-2 px-3 py-2 border-b border-border/60 cursor-grab active:cursor-grabbing bg-muted/40 rounded-t-xl">
      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="text-sm font-medium truncate flex-1">{title}</span>
      {badge}
    </div>
  );
}

/** Fixed task-info card (not a DB row). */
export const DetailCardNode = memo(function DetailCardNode() {
  const { task } = useCanvas();
  const status = statusConfig[task.status];
  const categoryLabel = task.category?.replace(/_/g, " ") || "task";
  const deadline = task.deadline ? new Date(task.deadline).toLocaleDateString() : null;

  return (
    <div className="group relative h-full w-full flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <NodeResizer
        minWidth={260}
        minHeight={180}
        lineClassName={RESIZE_LINE}
        handleClassName={RESIZE_HANDLE}
        handleStyle={RESIZE_HANDLE_STYLE}
        autoScale={false}
      />
      <CardHeader
        title={task.title}
        badge={
          <span
            className={cn(
              "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
              status.className
            )}
          >
            {status.label}
          </span>
        }
      />
      <div className="nowheel flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="capitalize">{categoryLabel}</span>
          {deadline && (
            <span className="px-2 py-0.5 rounded bg-muted">Deadline: {deadline}</span>
          )}
        </div>
        {task.description ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <Markdown className="text-foreground">{task.description}</Markdown>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No description provided.</p>
        )}
      </div>
    </div>
  );
});

/** Task-scoped chat window (not a DB row). */
export const ChatWindowNode = memo(function ChatWindowNode() {
  const {
    messages,
    threadAssets,
    streamingAssets,
    streamingContent,
    isStreaming,
    updateMessage,
    onSend,
    chatInputRef,
    referenceCount,
  } = useCanvas();

  const contextLabel =
    referenceCount > 0
      ? `${referenceCount} reference${referenceCount === 1 ? "" : "s"} attached`
      : "Task Execution";

  return (
    <div className="group relative h-full w-full flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <NodeResizer
        minWidth={320}
        minHeight={300}
        lineClassName={RESIZE_LINE}
        handleClassName={RESIZE_HANDLE}
        handleStyle={RESIZE_HANDLE_STYLE}
        autoScale={false}
      />
      <CardHeader title="AETEA Chat" />
      <div className="nodrag nowheel flex-1 min-h-0 flex flex-col">
        <ChatPanelDropZone
          className="flex-1 min-h-0"
          disabled={isStreaming}
          onFilesDropped={(files) => chatInputRef.current?.addFiles(files)}
        >
          <div className="flex-1 min-h-0">
            <ChatMessages
              messages={messages}
              threadAssets={threadAssets}
              streamingAssets={streamingAssets}
              streamingContent={streamingContent}
              isStreaming={isStreaming}
              updateMessage={updateMessage}
              showEmptyState={false}
              suppressInlineAssets
            />
          </div>
          <div className="px-2 pb-2">
            <ChatInput
              ref={chatInputRef}
              onSend={onSend}
              isStreaming={isStreaming}
              contextLabel={contextLabel}
              inputPlaceholder="Describe what to generate or refine..."
              textareaMaxHeight={140}
              variant="floating"
              enableGenerationModes
            />
          </div>
        </ChatPanelDropZone>
      </div>
    </div>
  );
});

/** Text/markdown preview: fetches content (truncated for the card). */
function TextPreview({ url }: { url: string }) {
  const { loading, error, text } = useTextContent(url, !!url);
  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }
  if (error || text == null) {
    return (
      <div className="flex h-full w-full items-center justify-center p-3 text-xs text-muted-foreground">
        Preview unavailable
      </div>
    );
  }
  const preview = text.length > 2000 ? `${text.slice(0, 2000)}…` : text;
  return (
    <div className="nowheel h-full w-full overflow-y-auto p-3">
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <Markdown className="text-foreground">{preview}</Markdown>
      </div>
    </div>
  );
}

/** Preview of a deliverable object, sized to fill the node. */
function ObjectPreview({ obj }: { obj: DeliverableObject }) {
  const kind = objectKind(obj);
  const url = obj.view_url || obj.download_url || "";
  const label = obj.title?.trim() || obj.file_name || obj.object_type;

  if (kind === "image" && url) {
    return (
      <img src={url} alt={label} className="h-full w-full object-contain rounded-b-xl" />
    );
  }
  if (kind === "video" && url) {
    return (
      <video src={url} controls className="h-full w-full object-contain rounded-b-xl" />
    );
  }
  if (kind === "pdf" && url) {
    return (
      <iframe
        src={`${url}#toolbar=0&navpanes=0&view=FitH`}
        title={label}
        className="nowheel pointer-events-none h-full w-full rounded-b-xl bg-white"
      />
    );
  }
  if (kind === "text") {
    return <TextPreview url={url} />;
  }
  return (
    <div className="nowheel h-full w-full overflow-y-auto p-3">
      <div className="flex items-start gap-3 min-w-0">
        <FileText className="h-8 w-8 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="font-medium text-sm break-words">{obj.file_name || label}</p>
          {obj.description && (
            <p className="text-xs text-muted-foreground mt-1 break-words">
              {obj.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Icon-only action button with a tooltip label. */
function IconAction({
  label,
  onClick,
  disabled,
  className,
  children,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="secondary"
          className={cn("h-7 w-7 shadow-sm", className)}
          disabled={disabled}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** Hover action bar: view (in-app), download, approve — icons + tooltips. */
function ObjectActionBar({
  object,
  isApproving,
  onApprove,
  onView,
}: {
  object: DeliverableObject;
  isApproving: boolean;
  onApprove: () => void;
  onView: () => void;
}) {
  return (
    <div className="nodrag absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <IconAction label="View" onClick={onView}>
        <Eye className="h-3.5 w-3.5" />
      </IconAction>

      {object.download_url && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="secondary" className="h-7 w-7 shadow-sm" asChild>
              <a href={object.download_url} download={object.file_name || true}>
                <Download className="h-3.5 w-3.5" />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download</TooltipContent>
        </Tooltip>
      )}

      {object.is_approved ? (
        <IconAction
          label="Approved"
          disabled
          className="!bg-green-500/90 !text-white !opacity-100"
        >
          <Check className="h-3.5 w-3.5" />
        </IconAction>
      ) : (
        <IconAction
          label="Approve"
          disabled={isApproving}
          onClick={onApprove}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isApproving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </IconAction>
      )}
    </div>
  );
}

export type DeliverableObjectNodeData = { object: DeliverableObject };

/** One deliverable object: draggable, resizable, selectable, hover actions. */
export const DeliverableObjectNode = memo(function DeliverableObjectNode({
  data,
  selected,
}: NodeProps) {
  const { onApprove, approvingIds, objects } = useCanvas();
  const { object } = data as DeliverableObjectNodeData;
  const [viewerOpen, setViewerOpen] = useState(false);
  const isApproving = approvingIds.has(object.id);
  const title = object.title?.trim() || object.file_name || object.object_type;

  return (
    <div
      className={cn(
        "group relative h-full w-full flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden",
        selected ? "border-primary ring-2 ring-primary/50" : "border-border",
        object.is_approved && "border-green-500/60"
      )}
    >
      <NodeResizer
        minWidth={180}
        minHeight={140}
        lineClassName={RESIZE_LINE}
        handleClassName={RESIZE_HANDLE}
        handleStyle={RESIZE_HANDLE_STYLE}
        autoScale={false}
      />
      <div className="drag-handle flex items-center gap-2 px-2.5 py-1.5 border-b border-border/60 cursor-grab active:cursor-grabbing bg-muted/40">
        <span className="text-xs font-medium truncate flex-1">{title}</span>
        <span className="text-[10px] uppercase text-muted-foreground shrink-0">
          {object.object_type}
        </span>
      </div>

      <div className="flex-1 min-h-0 bg-muted/20">
        <ObjectPreview obj={object} />
      </div>

      <ObjectActionBar
        object={object}
        isApproving={isApproving}
        onApprove={() => onApprove(object.id)}
        onView={() => setViewerOpen(true)}
      />

      {object.is_approved && (
        <span className="absolute top-1 left-1 inline-flex items-center gap-1 rounded-md bg-green-500/90 px-1.5 py-0.5 text-[10px] font-medium text-white group-hover:opacity-0 transition-opacity">
          <Check className="h-3 w-3" />
          Approved
        </span>
      )}

      <ObjectViewerDialog
        objects={objects}
        initialObjectId={object.id}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />
    </div>
  );
});

export type KeyVisualNodeData = {
  assetId: string | null;
  downloadUrl: string | null;
};

/** Fixed campaign key-visual card — selectable as a generation reference. */
export const KeyVisualNode = memo(function KeyVisualNode({
  data,
  selected,
}: NodeProps) {
  const { assetId, downloadUrl } = data as KeyVisualNodeData;
  const [viewerOpen, setViewerOpen] = useState(false);
  const hasImage = Boolean(assetId && downloadUrl);

  // Single-item list so ObjectViewerDialog can render without joining task deliverables.
  const viewerObjects: DeliverableObject[] = hasImage
    ? [
        {
          id: `key-visual:${assetId}`,
          task_id: "",
          asset_id: assetId!,
          object_type: "image",
          title: "Key Visual",
          mime_type: "image/*",
          view_url: downloadUrl,
          download_url: downloadUrl,
        },
      ]
    : [];

  return (
    <div
      className={cn(
        "group relative h-full w-full flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden",
        selected && hasImage
          ? "border-primary ring-2 ring-primary/50"
          : "border-border"
      )}
    >
      <NodeResizer
        minWidth={180}
        minHeight={140}
        lineClassName={RESIZE_LINE}
        handleClassName={RESIZE_HANDLE}
        handleStyle={RESIZE_HANDLE_STYLE}
        autoScale={false}
      />
      <div className="drag-handle flex items-center gap-2 px-2.5 py-1.5 border-b border-border/60 cursor-grab active:cursor-grabbing bg-muted/40">
        <span className="text-xs font-medium truncate flex-1">Key Visual</span>
      </div>

      <div className="flex-1 min-h-0 bg-muted/20">
        {hasImage ? (
          <img
            src={downloadUrl!}
            alt="Key visual"
            className="nowheel pointer-events-none h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-4 text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              No key visual yet — generate one from the Creative tab
            </p>
          </div>
        )}
      </div>

      {hasImage && downloadUrl && (
        <div className="nodrag absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <IconAction label="View" onClick={() => setViewerOpen(true)}>
            <Eye className="h-3.5 w-3.5" />
          </IconAction>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="secondary" className="h-7 w-7 shadow-sm" asChild>
                <a href={downloadUrl} download>
                  <Download className="h-3.5 w-3.5" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download</TooltipContent>
          </Tooltip>
        </div>
      )}

      {viewerObjects.length > 0 && (
        <ObjectViewerDialog
          objects={viewerObjects}
          initialObjectId={viewerObjects[0].id}
          open={viewerOpen}
          onOpenChange={setViewerOpen}
        />
      )}
    </div>
  );
});
