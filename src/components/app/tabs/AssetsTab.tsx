import { useState, useCallback } from "react";
import { Loader2, Folder, File, Download, Eye, Image, Grid3x3, List } from "lucide-react";
import { useAssets } from "@/hooks/useAssets";
import { refreshAssetUrls } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Asset } from "@/types/api";

type ViewMode = 'grid' | 'detail';

interface AssetsTabProps {
  chatId: string;
  isModifying?: boolean;
}

const FOLDERS = [
  { id: 'all', label: 'All Assets', path: undefined },
  { id: 'uploaded', label: 'Uploaded', path: 'Uploaded' },
  { id: 'generated', label: 'AETEA Generated', path: 'AETEA Generated' },
  { id: 'key-visual', label: 'Key visual', path: 'Key visual' },
  { id: 'completed-tasks', label: 'Completed tasks', path: 'Completed tasks' },
];

function isImageAsset(asset: Asset): boolean {
  return asset.mime_type.startsWith('image/');
}

function getFileIcon(asset: Asset) {
  if (isImageAsset(asset)) {
    return Image;
  }
  return File;
}

// URL expiration time: 1 hour in milliseconds
const URL_EXPIRATION_MS = 60 * 60 * 1000;

export function AssetsTab({ chatId, isModifying }: AssetsTabProps) {
  const { user } = useAuth();
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>('detail');
  const [refreshingUrls, setRefreshingUrls] = useState<Set<string>>(new Set());
  
  const { data, isLoading, error } = useAssets(chatId, selectedFolder);
  
  // Check if URL is expired (1 hour since fetch)
  const isUrlExpired = useCallback((fetchedAt?: number): boolean => {
    if (!fetchedAt) return true; // If no timestamp, assume expired
    const now = Date.now();
    return (now - fetchedAt) >= URL_EXPIRATION_MS;
  }, []);
  
  const getValidUrl = useCallback(
    async (asset: Asset, urlKey: 'view_url' | 'download_url'): Promise<string> => {
      const fetchedAt = (data as { _fetchedAt?: number })?._fetchedAt;
      const existingUrl = urlKey === 'view_url' ? asset.view_url : asset.download_url;

      if (!isUrlExpired(fetchedAt)) return existingUrl;
      if (refreshingUrls.has(asset.id)) return existingUrl;

      try {
        setRefreshingUrls((prev) => new Set(prev).add(asset.id));
        const result = await refreshAssetUrls(asset.id, user!.email!);
        return result[urlKey];
      } catch (err) {
        console.error('Failed to refresh asset URL:', err);
        return existingUrl;
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

  const handleView = useCallback(
    async (asset: Asset) => {
      const url = await getValidUrl(asset, 'view_url');
      window.open(url, '_blank');
    },
    [getValidUrl]
  );

  const handleDownload = useCallback(
    async (asset: Asset) => {
      const url = await getValidUrl(asset, 'download_url');
      window.open(url, '_blank');
    },
    [getValidUrl]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    console.error('Assets load error:', error);
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load assets</p>
        <p className="text-sm text-muted-foreground mt-2">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  const assets = data?.assets || [];

  return (
    <div className="space-y-6">
      {/* Folder Navigation and View Toggle */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-wrap gap-2">
            {FOLDERS.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.path)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  selectedFolder === folder.path
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                <Folder className="h-4 w-4" />
                {folder.label}
              </button>
            ))}
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 border border-border rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded transition-colors",
                viewMode === 'grid'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Grid view"
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('detail')}
              className={cn(
                "p-2 rounded transition-colors",
                viewMode === 'detail'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Detail view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Assets Display */}
      {assets.length === 0 ? (
        <div className="text-center py-12">
          <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {selectedFolder ? `No assets in "${FOLDERS.find(f => f.path === selectedFolder)?.label}"` : 'No assets found'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((asset) => {
            const FileIcon = getFileIcon(asset);
            
            return (
              <div
                key={asset.id}
                className={cn(
                  "border border-border rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col min-w-0",
                  isModifying && "opacity-50 pointer-events-none"
                )}
              >
                {/* Asset Preview/Icon */}
                <div className="aspect-square mb-3 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                  {isImageAsset(asset) ? (
                    <img
                      src={asset.download_url}
                      alt={asset.file_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to icon if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const icon = document.createElement('div');
                          icon.className = 'flex items-center justify-center';
                          icon.innerHTML = '<svg class="h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                          parent.appendChild(icon);
                        }
                      }}
                    />
                  ) : (
                    <FileIcon className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>

                {/* File Name */}
                <p className="text-sm font-medium truncate mb-2" title={asset.file_name}>
                  {asset.file_name}
                </p>

                {/* File Info */}
                <p className="text-xs text-muted-foreground mb-3">
                  {new Date(asset.created_at).toLocaleDateString()}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleView(asset)}
                    title="View"
                    disabled={refreshingUrls.has(asset.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleDownload(asset)}
                    title="Download"
                    disabled={refreshingUrls.has(asset.id)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Detail View - Windows File Explorer style */
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Date Modified</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset, index) => {
                  const FileIcon = getFileIcon(asset);
                  const fileExtension = asset.file_name.split('.').pop()?.toUpperCase() || 'FILE';
                  const mimeType = asset.mime_type.split('/')[0] || 'application';
                  
                  return (
                    <tr
                      key={asset.id}
                      className={cn(
                        "border-b border-border hover:bg-muted/30 transition-colors",
                        isModifying && "opacity-50 pointer-events-none",
                        index === assets.length - 1 && "border-b-0"
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {isImageAsset(asset) ? (
                              <img
                                src={asset.download_url}
                                alt={asset.file_name}
                                className="h-8 w-8 object-cover rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const icon = document.createElement('div');
                                    icon.className = 'flex items-center justify-center';
                                    icon.innerHTML = '<svg class="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                                    parent.appendChild(icon);
                                  }
                                }}
                              />
                            ) : (
                              <FileIcon className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-foreground truncate" title={asset.file_name}>
                            {asset.file_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {mimeType === 'image' ? 'Image' : mimeType === 'application' ? fileExtension : mimeType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {new Date(asset.created_at).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleView(asset)}
                            title="View"
                            disabled={refreshingUrls.has(asset.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDownload(asset)}
                            title="Download"
                            disabled={refreshingUrls.has(asset.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
