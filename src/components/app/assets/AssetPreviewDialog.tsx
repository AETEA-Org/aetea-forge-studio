import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Asset } from "@/types/api";

interface AssetPreviewDialogProps {
  /** Assets the arrows step through, in the order shown in the tree. */
  assets: Asset[];
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  resolveUrl: (asset: Asset, key: "view_url" | "download_url") => Promise<string>;
  onDownload: (asset: Asset) => void;
}

export function AssetPreviewDialog({
  assets,
  index,
  onIndexChange,
  onClose,
  resolveUrl,
  onDownload,
}: AssetPreviewDialogProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const asset = index === null ? undefined : assets[index];

  const hasPrevious = index !== null && index > 0;
  const hasNext = index !== null && index < assets.length - 1;

  useEffect(() => {
    if (!asset) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setUrl(null);
    resolveUrl(asset, "view_url")
      .then((next) => {
        if (!cancelled) setUrl(next);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [asset, resolveUrl]);

  const goPrevious = useCallback(() => {
    if (hasPrevious && index !== null) onIndexChange(index - 1);
  }, [hasPrevious, index, onIndexChange]);

  const goNext = useCallback(() => {
    if (hasNext && index !== null) onIndexChange(index + 1);
  }, [hasNext, index, onIndexChange]);

  useEffect(() => {
    if (!asset) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrevious();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [asset, goPrevious, goNext]);

  if (!asset) return null;
  const mime = (asset.mime_type || "").toLowerCase();

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl gap-3">
        <DialogTitle className="truncate pr-8 text-base">{asset.file_name}</DialogTitle>

        <div className="relative flex min-h-[50vh] items-center justify-center rounded-lg bg-muted/30">
          {loading && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}

          {!loading && url && mime.startsWith("image/") && (
            <img
              src={url}
              alt={asset.file_name}
              className="max-h-[70vh] max-w-full rounded object-contain"
            />
          )}
          {!loading && url && mime.startsWith("video/") && (
            <video src={url} controls className="max-h-[70vh] max-w-full rounded">
              <track kind="captions" />
            </video>
          )}
          {!loading && url && mime === "application/pdf" && (
            <iframe src={url} title={asset.file_name} className="h-[70vh] w-full rounded" />
          )}
          {!loading && !url && (
            <p className="text-sm text-muted-foreground">Preview unavailable.</p>
          )}

          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label="Previous asset"
            disabled={!hasPrevious}
            onClick={goPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full shadow"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label="Next asset"
            disabled={!hasNext}
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full shadow"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">
            {index !== null ? index + 1 : 0} of {assets.length}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => onDownload(asset)}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
