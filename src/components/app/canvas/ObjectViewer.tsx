import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, FileText, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { DeliverableObject } from "@/types/api";

export type ObjectKind = "image" | "video" | "pdf" | "text" | "other";

/** Classify an object so preview + viewer render the right thing. */
export function objectKind(obj: DeliverableObject): ObjectKind {
  const mime = obj.mime_type?.toLowerCase() ?? "";
  const type = obj.object_type?.toLowerCase() ?? "";
  const name = obj.file_name?.toLowerCase() ?? "";
  if (type === "image" || mime.startsWith("image/")) return "image";
  if (type === "video" || mime.startsWith("video/")) return "video";
  if (type === "pdf" || mime === "application/pdf" || name.endsWith(".pdf")) {
    return "pdf";
  }
  if (
    type === "text" ||
    mime.startsWith("text/") ||
    mime === "application/json" ||
    name.endsWith(".md") ||
    name.endsWith(".txt")
  ) {
    return "text";
  }
  return "other";
}

interface TextState {
  loading: boolean;
  error: boolean;
  text: string | null;
}

/** Fetch a text/markdown asset's content from its signed URL. */
export function useTextContent(url: string, enabled: boolean): TextState {
  const [state, setState] = useState<TextState>({
    loading: false,
    error: false,
    text: null,
  });

  useEffect(() => {
    if (!enabled || !url) {
      setState({ loading: false, error: false, text: null });
      return;
    }
    let cancelled = false;
    setState({ loading: true, error: false, text: null });
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((text) => {
        if (!cancelled) setState({ loading: false, error: false, text });
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, error: true, text: null });
      });
    return () => {
      cancelled = true;
    };
  }, [url, enabled]);

  return state;
}

function thumbUrl(obj: DeliverableObject): string | null {
  return obj.view_url || obj.download_url || null;
}

/** Full-size in-app viewer with prev/next, filmstrip, and download. */
export function ObjectViewerDialog({
  objects,
  initialObjectId,
  open,
  onOpenChange,
}: {
  objects: DeliverableObject[];
  initialObjectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const initialIndex = useMemo(() => {
    const idx = objects.findIndex((o) => o.id === initialObjectId);
    return idx >= 0 ? idx : 0;
  }, [objects, initialObjectId]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Reset index when the dialog opens on a different object.
  useEffect(() => {
    if (open) setCurrentIndex(initialIndex);
  }, [open, initialIndex]);

  const object = objects[currentIndex] ?? objects[0];
  const canPrev = currentIndex > 0;
  const canNext = currentIndex < objects.length - 1;
  const showNav = objects.length > 1;

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);
  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(objects.length - 1, i + 1));
  }, [objects.length]);

  useEffect(() => {
    if (!open || !showNav) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, showNav, goPrev, goNext]);

  if (!object) return null;

  const kind = objectKind(object);
  const url = object.view_url || object.download_url || "";
  const title = object.title?.trim() || object.file_name || object.object_type;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader className="pr-8">
          <div className="flex items-center gap-2">
            {showNav && (
              <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!canPrev}
                  onClick={goPrev}
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!canNext}
                  onClick={goNext}
                  aria-label="Next"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            <DialogTitle className="truncate flex-1">{title}</DialogTitle>
            {object.download_url && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" asChild>
                    <a href={object.download_url} download={object.file_name || true}>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download</TooltipContent>
              </Tooltip>
            )}
          </div>
        </DialogHeader>

        <ObjectViewerBody kind={kind} url={url} title={title} open={open} />

        {showNav && (
          <div className="flex gap-2 overflow-x-auto pb-1 pt-1">
            {objects.map((obj, i) => {
              const tUrl = thumbUrl(obj);
              const tKind = objectKind(obj);
              const label = obj.title?.trim() || obj.file_name || obj.object_type;
              return (
                <button
                  key={obj.id}
                  type="button"
                  onClick={() => setCurrentIndex(i)}
                  className={cn(
                    "relative h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-muted/40",
                    i === currentIndex
                      ? "border-primary ring-2 ring-primary/40"
                      : "border-border hover:border-muted-foreground/40"
                  )}
                  title={label}
                  aria-label={label}
                  aria-current={i === currentIndex ? "true" : undefined}
                >
                  {tKind === "image" && tUrl ? (
                    <img src={tUrl} alt="" className="h-full w-full object-cover" />
                  ) : tKind === "video" && tUrl ? (
                    <video src={tUrl} muted className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ObjectViewerBody({
  kind,
  url,
  title,
  open,
}: {
  kind: ObjectKind;
  url: string;
  title: string;
  open: boolean;
}) {
  const textState = useTextContent(url, open && kind === "text");

  return (
    <div className="min-h-0">
      {kind === "image" && url && (
        <img
          src={url}
          alt={title}
          className="mx-auto max-h-[70vh] w-auto object-contain rounded-md"
        />
      )}
      {kind === "video" && url && (
        <video src={url} controls className="mx-auto max-h-[70vh] w-full rounded-md" />
      )}
      {kind === "pdf" && url && (
        <iframe
          src={url}
          title={title}
          className="w-full h-[70vh] rounded-md border border-border"
        />
      )}
      {kind === "text" && (
        <div className="max-h-[70vh] overflow-y-auto rounded-md border border-border p-4">
          {textState.loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : textState.error || textState.text == null ? (
            <p className="text-sm text-muted-foreground">Preview unavailable.</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Markdown className="text-foreground">{textState.text}</Markdown>
            </div>
          )}
        </div>
      )}
      {kind === "other" && (
        <p className="text-sm text-muted-foreground py-6">
          No inline preview for this file type. Use Download to open it.
        </p>
      )}
    </div>
  );
}
