import { cn } from "@/lib/utils";
import { 
  FileText, 
  Search, 
  Target, 
  FolderOpen,
  Palette,
  BarChart3, 
  Settings 
} from "lucide-react";

export type CampaignTab = 'brief' | 'asset' | 'research' | 'strategy' | 'creative' | 'analytics' | 'settings';

interface CampaignTabsProps {
  activeTab: CampaignTab;
  onTabChange: (tab: CampaignTab) => void;
}

const tabs: { id: CampaignTab; label: string; icon: React.ElementType; comingSoon?: boolean }[] = [
  { id: 'brief', label: 'Brief', icon: FileText },
  { id: 'asset', label: 'Assets', icon: FolderOpen },
  { id: 'research', label: 'Research', icon: Search },
  { id: 'strategy', label: 'Strategy', icon: Target },
  { id: 'creative', label: 'Creative', icon: Palette },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, comingSoon: true },
  { id: 'settings', label: 'Controls', icon: Settings, comingSoon: true },
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
            {tab.comingSoon && (
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">Soon</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
