import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  Image as ImageIcon,
  PanelLeftClose,
  Palette,
  Search,
  Settings,
  Target,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAssetFolders, getAssets } from "@/services/api";
import {
  buildAssetsByFolder,
  childFoldersOf,
  getTopFolders,
} from "@/components/app/assets/assetTreeUtils";
import type { Asset, AssetFolder } from "@/types/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BriefTab } from "@/components/app/tabs/BriefTab";
import { ResearchTab } from "@/components/app/tabs/ResearchTab";
import { StrategyTab } from "@/components/app/tabs/StrategyTab";
import { CreativeTab } from "@/components/app/tabs/CreativeTab";
import { AnalyticsTab } from "@/components/app/tabs/AnalyticsTab";
import { CampaignSettingsTab } from "@/components/app/tabs/CampaignSettingsTab";

type TabId = "brief" | "research" | "strategy" | "creative" | "analytics" | "settings";

const TAB_ROWS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "brief", label: "Brief", icon: FileText },
  { id: "research", label: "Research", icon: Search },
  { id: "strategy", label: "Strategy", icon: Target },
  { id: "creative", label: "Creative", icon: Palette },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Controls", icon: Settings },
];

interface CanvasLeftPaneProps {
  campaignId: string | undefined;
  chatId: string;
  campaignTitle: string;
  onCollapse: () => void;
}

function AssetFileRow({ asset }: { asset: Asset }) {
  const isImage = asset.mime_type.startsWith("image/");
  const url = asset.view_url || asset.download_url;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      title={asset.file_name}
    >
      {isImage ? (
        <ImageIcon className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <FileText className="h-3.5 w-3.5 shrink-0" />
      )}
      <span className="truncate">{asset.file_name}</span>
    </a>
  );
}

function FolderTreeNode({
  folder,
  folders,
  assetsByFolder,
  depth,
}: {
  folder: AssetFolder;
  folders: AssetFolder[];
  assetsByFolder: Map<string, Asset[]>;
  depth: number;
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
        className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-xs font-medium hover:bg-muted/60"
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        )}
        {open ? (
          <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary" />
        ) : (
          <Folder className="h-3.5 w-3.5 shrink-0 text-primary" />
        )}
        <span className="truncate">{folder.name}</span>
      </button>
      {open && (
        <div style={{ paddingLeft: depth * 12 }}>
          {childFolders.map((child) => (
            <FolderTreeNode
              key={child.id}
              folder={child}
              folders={folders}
              assetsByFolder={assetsByFolder}
              depth={depth + 1}
            />
          ))}
          <div style={{ paddingLeft: 20 }}>
            {files.map((asset) => (
              <AssetFileRow key={asset.id} asset={asset} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AssetTree({ chatId }: { chatId: string }) {
  const { user } = useAuth();
  const { data: foldersData } = useQuery({
    queryKey: ["asset-folders", chatId, user?.email],
    queryFn: () => getAssetFolders(chatId, user!.email!),
    enabled: !!chatId && !!user?.email,
  });
  const { data: assetsData } = useQuery({
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

  if (folders.length === 0) {
    return <p className="px-2 py-1 text-xs text-muted-foreground">No folders yet.</p>;
  }

  return (
    <div className="space-y-0.5">
      {topFolders.map((folder) => (
        <FolderTreeNode
          key={folder.id}
          folder={folder}
          folders={folders}
          assetsByFolder={assetsByFolder}
          depth={0}
        />
      ))}
    </div>
  );
}

function TabDialogBody({
  tab,
  campaignId,
  chatId,
}: {
  tab: TabId;
  campaignId: string | undefined;
  chatId: string;
}) {
  if (!campaignId) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No campaign found for this chat.
      </p>
    );
  }
  switch (tab) {
    case "brief":
      return <BriefTab campaignId={campaignId} />;
    case "research":
      return <ResearchTab campaignId={campaignId} />;
    case "strategy":
      return <StrategyTab campaignId={campaignId} />;
    case "creative":
      return <CreativeTab campaignId={campaignId} chatId={chatId} />;
    case "analytics":
      return <AnalyticsTab />;
    case "settings":
      return <CampaignSettingsTab />;
    default:
      return null;
  }
}

export function CanvasLeftPane({
  campaignId,
  chatId,
  campaignTitle,
  onCollapse,
}: CanvasLeftPaneProps) {
  const [openTab, setOpenTab] = useState<TabId | null>(null);
  const [assetsOpen, setAssetsOpen] = useState(true);
  const activeRow = TAB_ROWS.find((t) => t.id === openTab);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-card/40">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <span className="truncate text-sm font-semibold" title={campaignTitle}>
          {campaignTitle}
        </span>
        <button
          type="button"
          onClick={onCollapse}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Collapse panel"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <nav className="space-y-0.5">
          {TAB_ROWS.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setOpenTab(row.id)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            >
              <row.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{row.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-3 border-t border-border pt-2">
          <button
            type="button"
            onClick={() => setAssetsOpen((o) => !o)}
            className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm font-medium hover:bg-muted/60"
          >
            {assetsOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
            <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
            <span>Assets</span>
          </button>
          {assetsOpen && (
            <div className="mt-1">
              <AssetTree chatId={chatId} />
            </div>
          )}
        </div>
      </div>

      <Dialog open={openTab !== null} onOpenChange={(open) => !open && setOpenTab(null)}>
        <DialogContent className="max-w-5xl w-[calc(100vw-2rem)] max-h-[90vh] overflow-hidden flex flex-col gap-0 sm:max-h-[85vh]">
          <DialogHeader className="shrink-0 pr-10">
            <DialogTitle>{activeRow?.label}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto pr-1 pt-2">
            {openTab && (
              <TabDialogBody tab={openTab} campaignId={campaignId} chatId={chatId} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
