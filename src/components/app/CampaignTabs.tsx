import { cn } from "@/lib/utils";
import {
  FileText,
  Search,
  Target,
  FolderOpen,
  Palette,
} from "lucide-react";

export type CampaignTab = 'brief' | 'asset' | 'research' | 'strategy' | 'creative' | 'analytics' | 'settings';

interface CampaignTabsProps {
  activeTab: CampaignTab;
  onTabChange: (tab: CampaignTab) => void;
}

/**
 * Only tabs that lead somewhere.
 *
 * Analytics and Controls were listed with a "Soon" badge and were still
 * clickable, so the strip advertised two pages that do not exist and let you
 * navigate to them. They were also what pushed the strip past the available
 * width and made it scroll sideways. The `CampaignTab` type still names them,
 * so adding either back is one line here once it is built.
 */
const tabs: { id: CampaignTab; label: string; icon: React.ElementType }[] = [
  { id: 'brief', label: 'Brief', icon: FileText },
  { id: 'asset', label: 'Assets', icon: FolderOpen },
  { id: 'research', label: 'Research', icon: Search },
  { id: 'strategy', label: 'Strategy', icon: Target },
  { id: 'creative', label: 'Creative', icon: Palette },
];

export function CampaignTabs({ activeTab, onTabChange }: CampaignTabsProps) {
  return (
    <div className="border-b border-border mb-6">
      <nav className="flex gap-1 -mb-px overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
