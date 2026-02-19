import { useState, useCallback } from "react";
import { Loader2, File, Image, Download, Folder } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAssets } from "@/hooks/useAssets";
import { refreshAssetUrls } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { Asset } from "@/types/api";

const URL_EXPIRATION_MS = 60 * 60 * 1000;

function isImageAsset(asset: Asset): boolean {
  return asset.mime_type.startsWith("image/");
}

function getFileIcon(asset: Asset) {
  return isImageAsset(asset) ? Image : File;
}

interface AssetsModalProps {
  chatId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssetsModal({ chatId, open, onOpenChange }: AssetsModalProps) {
  const { user } = useAuth();
  const [refreshingUrls, setRefreshingUrls] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useAssets(chatId, undefined);

  const isUrlExpired = useCallback((fetchedAt?: number): boolean => {
    if (!fetchedAt) return true;
    return Date.now() - fetchedAt >= URL_EXPIRATION_MS;
  }, []);

  const getValidDownloadUrl = useCallback(
    async (asset: Asset): Promise<string> => {
      const fetchedAt = (data as { _fetchedAt?: number })?._fetchedAt;
      if (!isUrlExpired(fetchedAt)) return asset.download_url;
      if (refreshingUrls.has(asset.id)) return asset.download_url;
      try {
        setRefreshingUrls((prev) => new Set(prev).add(asset.id));
        const result = await refreshAssetUrls(asset.id, user!.email!);
        return result.download_url;
      } catch (err) {
        console.error("Failed to refresh asset URL:", err);
        return asset.download_url;
      } finally {
        setRefreshingUrls((prev) => {
          const next = new Set(prev);
          next.delete(asset.id);
          return next;
        });
      }
    },
    [data, isUrlExpired, refreshingUrls, user]
  );

  const handleAssetClick = useCallback(
    async (asset: Asset) => {
      const url = await getValidDownloadUrl(asset);
      window.open(url, "_blank");
    },
    [getValidDownloadUrl]
  );

  const assets = data?.assets ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[80vh] flex flex-col gap-0 p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>Assets</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {!open ? null : isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive">Failed to load assets</p>
              <p className="text-sm text-muted-foreground mt-2">
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No assets yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {assets.map((asset) => {
                const FileIcon = getFileIcon(asset);
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => handleAssetClick(asset)}
                    disabled={refreshingUrls.has(asset.id)}
                    className={cn(
                      "border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors text-left flex flex-col min-w-0",
                      refreshingUrls.has(asset.id) && "opacity-60"
                    )}
                  >
                    <div className="aspect-square mb-2 bg-muted rounded flex items-center justify-center overflow-hidden">
                      {isImageAsset(asset) ? (
                        <img
                          src={asset.view_url}
                          alt={asset.file_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileIcon className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    <span className="text-sm font-medium truncate" title={asset.file_name}>
                      {asset.file_name}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      Download
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
