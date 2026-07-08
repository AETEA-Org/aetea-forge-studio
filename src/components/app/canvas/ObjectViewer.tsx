import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";
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

/** Full-size in-app viewer with a download affordance, for any object type. */
export function ObjectViewerDialog({
  object,
  open,
  onOpenChange,
}: {
  object: DeliverableObject;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const kind = objectKind(object);
  const url = object.view_url || object.download_url || "";
  const title = object.title?.trim() || object.file_name || object.object_type;
  const textState = useTextContent(url, open && kind === "text");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader className="pr-8">
          <div className="flex items-center gap-3">
            <DialogTitle className="truncate flex-1">{title}</DialogTitle>
            {object.download_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={object.download_url} download={object.file_name || true}>
                  <Download className="h-4 w-4 mr-1.5" />
                  Download
                </a>
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="min-h-0">
          {kind === "image" && url && (
            <img
              src={url}
              alt={title}
              className="mx-auto max-h-[75vh] w-auto object-contain rounded-md"
            />
          )}
          {kind === "video" && url && (
            <video src={url} controls className="mx-auto max-h-[75vh] w-full rounded-md" />
          )}
          {kind === "pdf" && url && (
            <iframe
              src={url}
              title={title}
              className="w-full h-[75vh] rounded-md border border-border"
            />
          )}
          {kind === "text" && (
            <div className="max-h-[75vh] overflow-y-auto rounded-md border border-border p-4">
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
      </DialogContent>
    </Dialog>
  );
}
