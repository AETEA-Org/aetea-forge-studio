import type { CampaignTab } from "@/components/app/CampaignTabs";

interface UseChatContextProps {
  activeTab?: CampaignTab;
  selectedTaskId?: string | null;
}

interface ChatContext {
  context: string;
  contextLabel: string;
}

export function useChatContext({
  activeTab,
  selectedTaskId,
}: UseChatContextProps = {}): ChatContext {
  // Otherwise, use the active tab name with "tab:" prefix
  const tab = activeTab || 'brief';
  const context = `tab:${tab}`;
  const contextLabels: Record<CampaignTab, string> = {
    brief: 'Brief',
    asset: 'Asset',
    research: 'Research',
    strategy: 'Strategy',
    analytics: 'Analytics',
    settings: 'Settings',
  };

  return {
    context: context,
    contextLabel: contextLabels[tab] || 'Brief',
  };
}
