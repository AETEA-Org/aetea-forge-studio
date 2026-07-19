import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  File,
  Folder,
  FolderOpen,
  Image,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  deleteAsset,
  getAssetFolders,
  getAssets,
  refreshAssetUrls,
  renameAsset,
} from "@/services/api";
import {
  buildAssetsByFolder,
  childFoldersOf,
  getTopFolders,
} from "@/components/app/assets/assetTreeUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { Asset, AssetFolder } from "@/types/api";
import { toast } from "sonner";

interface AssetsTabProps {
  chatId: string;
  isModifying?: boolean;
}

const URL_EXPIRATION_MS = 60 * 60 * 1000;

function isImageAsset(asset: Asset): boolean {
  return asset.mime_type.startsWith("image/");
}

function typeLabel(asset: Asset): string {
  const ext = asset.file_name.split(".").pop()?.toUpperCase() || "FILE";
  const mimeRoot = asset.mime_type.split("/")[0] || "application";
  if (mimeRoot === "image") return "Image";
  if (mimeRoot === "video") return "Video";
  if (mimeRoot === "text") return "Text";
  if (mimeRoot === "application") return ext;
  return mimeRoot;
}

function AssetsFileRow({
  asset,
  depth,
  disabled,
  onView,
  onDownload,
  onRename,
  onRequestDelete,
}: {
  asset: Asset;
  depth: number;
  disabled?: boolean;
  onView: (asset: Asset) => void;
  onDownload: (asset: Asset) => void;
  onRename: (asset: Asset, nextName: string) => Promise<void>;
  onRequestDelete: (asset: Asset) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState(asset.file_name);
  const [saving, setSaving] = useState(false);
  const FileIcon = isImageAsset(asset) ? Image : File;

  const commitRename = async () => {
    const next = draftName.trim();
    if (!next || next === asset.file_name) {
      setDraftName(asset.file_name);
      setRenaming(false);
      return;
    }
    setSaving(true);
    try {
      await onRename(asset, next);
      setRenaming(false);
    } catch {
      setDraftName(asset.file_name);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/40",
        disabled && "pointer-events-none opacity-50"
      )}
      style={{ paddingLeft: 12 + depth * 12 }}
    >
      <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        {renaming ? (
          <Input
            autoFocus
            value={draftName}
            disabled={saving}
            className="h-7 text-sm"
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={() => void commitRename()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void commitRename();
              }
              if (e.key === "Escape") {
                setDraftName(asset.file_name);
                setRenaming(false);
              }
            }}
          />
        ) : (
          <button
            type="button"
            className="block w-full truncate text-left text-sm font-medium hover:underline"
            title={asset.file_name}
            onClick={() => onView(asset)}
          >
            {asset.file_name}
          </button>
        )}
      </div>
      <span className="hidden w-20 shrink-0 text-xs text-muted-foreground sm:block">
        {typeLabel(asset)}
      </span>
      <span className="hidden w-36 shrink-0 text-xs text-muted-foreground md:block">
        {new Date(asset.created_at).toLocaleString()}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 data-[state=open]:opacity-100"
            aria-label={`Actions for ${asset.file_name}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => onView(asset)}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDownload(asset)}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setDraftName(asset.file_name);
              setRenaming(true);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onRequestDelete(asset)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function FolderTreeNode({
  folder,
  folders,
  assetsByFolder,
  depth,
  disabled,
  onView,
  onDownload,
  onRename,
  onRequestDelete,
}: {
  folder: AssetFolder;
  folders: AssetFolder[];
  assetsByFolder: Map<string, Asset[]>;
  depth: number;
  disabled?: boolean;
  onView: (asset: Asset) => void;
  onDownload: (asset: Asset) => void;
  onRename: (asset: Asset, nextName: string) => Promise<void>;
  onRequestDelete: (asset: Asset) => void;
}) {
  const [open, setOpen] = useState(depth === 0);
  const childFolders = useMemo(
    () => childFoldersOf(folders, folder.id),
    [folders, folder.id]
  );
  const files = assetsByFolder.get(folder.id) ?? [];

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted/60"
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" />
        )}
        {open ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-primary" />
        )}
        <span className="truncate">{folder.name}</span>
      </button>
      {open && (
        <div>
          {childFolders.map((child) => (
            <FolderTreeNode
              key={child.id}
              folder={child}
              folders={folders}
              assetsByFolder={assetsByFolder}
              depth={depth + 1}
              disabled={disabled}
              onView={onView}
              onDownload={onDownload}
              onRename={onRename}
              onRequestDelete={onRequestDelete}
            />
          ))}
          {files.map((asset) => (
            <AssetsFileRow
              key={asset.id}
              asset={asset}
              depth={depth + 1}
              disabled={disabled}
              onView={onView}
              onDownload={onDownload}
              onRename={onRename}
              onRequestDelete={onRequestDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AssetsTab({ chatId, isModifying }: AssetsTabProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshingUrls, setRefreshingUrls] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<Asset | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    data: foldersData,
    isLoading: foldersLoading,
    error: foldersError,
  } = useQuery({
    queryKey: ["asset-folders", chatId, user?.email],
    queryFn: () => getAssetFolders(chatId, user!.email!),
    enabled: !!chatId && !!user?.email,
  });

  const {
    data: assetsData,
    isLoading: assetsLoading,
    error: assetsError,
  } = useQuery({
    queryKey: ["assets", chatId, undefined, user?.email],
    queryFn: () => getAssets(chatId, user!.email!),
    enabled: !!chatId && !!user?.email,
  });

  const folders = useMemo(() => foldersData?.folders ?? [], [foldersData]);
  const assetsByFolder = useMemo(
    () => buildAssetsByFolder(assetsData?.assets ?? []),
    [assetsData]
  );
  const topFolders = useMemo(() => getTopFolders(folders), [folders]);
  const fetchedAt = (assetsData as { _fetchedAt?: number } | undefined)?._fetchedAt;

  const isUrlExpired = useCallback((at?: number): boolean => {
    if (!at) return true;
    return Date.now() - at >= URL_EXPIRATION_MS;
  }, []);

  const getValidUrl = useCallback(
    async (asset: Asset, urlKey: "view_url" | "download_url"): Promise<string> => {
      const existingUrl = urlKey === "view_url" ? asset.view_url : asset.download_url;
      if (!isUrlExpired(fetchedAt)) return existingUrl;
      if (refreshingUrls.has(asset.id)) return existingUrl;
      try {
        setRefreshingUrls((prev) => new Set(prev).add(asset.id));
        const result = await refreshAssetUrls(asset.id, user!.email!);
        return result[urlKey];
      } catch (err) {
        console.error("Failed to refresh asset URL:", err);
        return existingUrl;
      } finally {
        setRefreshingUrls((prev) => {
          const next = new Set(prev);
          next.delete(asset.id);
          return next;
        });
      }
    },
    [fetchedAt, isUrlExpired, refreshingUrls, user]
  );

  const invalidateAssetQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["assets", chatId] }),
      queryClient.invalidateQueries({ queryKey: ["asset-folders", chatId] }),
    ]);
  }, [chatId, queryClient]);

  const handleView = useCallback(
    async (asset: Asset) => {
      const url = await getValidUrl(asset, "view_url");
      window.open(url, "_blank");
    },
    [getValidUrl]
  );

  const handleDownload = useCallback(
    async (asset: Asset) => {
      const url = await getValidUrl(asset, "download_url");
      window.open(url, "_blank");
    },
    [getValidUrl]
  );

  const handleRename = useCallback(
    async (asset: Asset, nextName: string) => {
      try {
        await renameAsset(asset.id, user!.email!, nextName);
        await invalidateAssetQueries();
        toast.success("File renamed");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to rename");
        throw err;
      }
    },
    [invalidateAssetQueries, user]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete || !user?.email) return;
    setDeleting(true);
    try {
      await deleteAsset(pendingDelete.id, user.email);
      setPendingDelete(null);
      await invalidateAssetQueries();
      toast.success("File deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }, [invalidateAssetQueries, pendingDelete, user]);

  if (foldersLoading || assetsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const error = foldersError || assetsError;
  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-destructive">Failed to load assets</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  const totalFiles = assetsData?.assets?.length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-semibold">Assets</h3>
          <p className="text-xs text-muted-foreground">
            {totalFiles} file{totalFiles === 1 ? "" : "s"} in campaign folders
          </p>
        </div>
      </div>

      {folders.length === 0 && totalFiles === 0 ? (
        <div className="py-12 text-center">
          <Folder className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No assets found</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <div className="hidden items-center gap-3 border-b border-border bg-muted/40 px-2 py-2 text-xs font-medium text-muted-foreground sm:flex">
            <span className="min-w-0 flex-1 pl-8">Name</span>
            <span className="w-20 shrink-0">Type</span>
            <span className="hidden w-36 shrink-0 md:block">Date Modified</span>
            <span className="w-7 shrink-0" />
          </div>
          <div className="p-1">
            {topFolders.map((folder) => (
              <FolderTreeNode
                key={folder.id}
                folder={folder}
                folders={folders}
                assetsByFolder={assetsByFolder}
                depth={0}
                disabled={isModifying}
                onView={handleView}
                onDownload={handleDownload}
                onRename={handleRename}
                onRequestDelete={setPendingDelete}
              />
            ))}
          </div>
        </div>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && !deleting && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                &quot;{pendingDelete?.file_name}&quot;
              </span>
              ? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleConfirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
