import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, Image as ImageIcon, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Asset, ChatRenderableAsset } from "@/types/api";

export function assetToRenderable(a: Asset): ChatRenderableAsset {
  return {
    id: a.id,
    mime_type: a.mime_type,
    view_url: a.view_url,
    download_url: a.download_url,
    file_name: a.file_name,
  };
}

function isVideoMime(m: string) {
  return m.startsWith("video/");
}

function isImageMime(m: string) {
  return m.startsWith("image/");
}

interface ChatMessageAssetsProps {
  assets: ChatRenderableAsset[];
  className?: string;
}

export function ChatMessageAssets({ assets, className }: ChatMessageAssetsProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const open = openIndex !== null && openIndex >= 0 && openIndex < assets.length;
  const active = open ? assets[openIndex] : null;

  const close = useCallback(() => setOpenIndex(null), []);

  if (!assets.length) return null;

  return (
    <>
      <div
        className={cn(
          "grid gap-2 w-full",
          "grid-cols-[repeat(auto-fill,minmax(120px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(140px,1fr))]",
          className
        )}
      >
        {assets.map((asset, index) => (
          <button
            key={asset.id}
            type="button"
            onClick={() => setOpenIndex(index)}
            className={cn(
              "relative rounded-lg border border-border/80 bg-muted/40 overflow-hidden",
              "aspect-square max-h-40 flex flex-col items-center justify-center",
              "hover:ring-2 hover:ring-primary/40 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            )}
          >
            <AssetTileInner asset={asset} />
          </button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-[min(96vw,900px)] max-h-[90vh] flex flex-col gap-2 p-0 overflow-hidden">
          {active ? (
            <>
              <DialogHeader className="px-4 pt-4 pb-0 space-y-1 shrink-0">
                <DialogTitle className="text-base truncate pr-8">
                  {active.file_name || active.id}
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 min-h-0 px-4 pb-4 flex flex-col gap-3 overflow-auto">
                <AssetLightboxBody asset={active} />
                <div className="flex flex-wrap gap-2 justify-end shrink-0">
                  {active.download_url ? (
                    <Button variant="default" size="sm" asChild>
                      <a href={active.download_url} download={active.file_name || true}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  ) : null}
                  <Button variant="outline" size="sm" type="button" onClick={close}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function AssetTileInner({ asset }: { asset: ChatRenderableAsset }) {
  const url = asset.view_url || asset.download_url;
  if (!url) {
    return (
      <span className="text-[10px] text-muted-foreground px-1 text-center break-all">
        {asset.id.slice(0, 8)}…
      </span>
    );
  }
  if (isVideoMime(asset.mime_type)) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-black/20">
        <video
          src={url}
          className="max-w-full max-h-full object-contain"
          muted
          playsInline
          preload="metadata"
        />
        <Video className="absolute h-8 w-8 text-white/80 drop-shadow pointer-events-none" />
      </div>
    );
  }
  if (isImageMime(asset.mime_type)) {
    return (
      <img
        src={url}
        alt={asset.file_name || asset.id}
        className="w-full h-full object-contain max-h-36"
      />
    );
  }
  if (asset.mime_type === "application/pdf") {
    return (
      <div className="flex flex-col items-center gap-1 p-2 text-center">
        <FileText className="h-10 w-10 text-muted-foreground shrink-0" />
        <span className="text-[10px] text-muted-foreground line-clamp-2">
          {asset.file_name || "PDF"}
        </span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-1 p-2 text-center">
      <ImageIcon className="h-8 w-8 text-muted-foreground" />
      <span className="text-[10px] text-muted-foreground line-clamp-2">
        {asset.file_name || asset.mime_type}
      </span>
    </div>
  );
}

function AssetLightboxBody({ asset }: { asset: ChatRenderableAsset }) {
  const url = asset.view_url || asset.download_url;
  if (!url) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Preview unavailable for this asset.
      </p>
    );
  }
  if (isVideoMime(asset.mime_type)) {
    return (
      <video
        src={url}
        controls
        className="w-full max-h-[min(70vh,560px)] rounded-md bg-black mx-auto"
      />
    );
  }
  if (isImageMime(asset.mime_type)) {
    return (
      <img
        src={url}
        alt={asset.file_name || asset.id}
        className="w-full max-h-[min(70vh,560px)] object-contain rounded-md mx-auto"
      />
    );
  }
  if (asset.mime_type === "application/pdf") {
    return (
      <iframe
        title={asset.file_name || "PDF"}
        src={url}
        className="w-full min-h-[min(70vh,560px)] rounded-md border border-border bg-background"
      />
    );
  }
  return (
    <div className="rounded-md border border-border p-6 text-center space-y-2">
      <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{asset.file_name || asset.mime_type}</p>
      {url ? (
        <Button variant="outline" size="sm" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            Open file
          </a>
        </Button>
      ) : null}
    </div>
  );
}
