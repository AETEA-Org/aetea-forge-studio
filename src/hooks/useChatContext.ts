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
  // When viewing a task, send task context so AI can complete/re-do the task
  if (selectedTaskId) {
    return {
      context: `task:${selectedTaskId}`,
      contextLabel: 'Task',
    };
  }
  const tab = activeTab || 'brief';
  const contextLabels: Record<CampaignTab, string> = {
    brief: 'Brief',
    asset: 'Asset',
    research: 'Research',
    strategy: 'Strategy',
    creative: 'Creative',
    analytics: 'Analytics',
    settings: 'Controls',
  };
  return {
    context: `tab:${tab}`,
    contextLabel: contextLabels[tab] || 'Brief',
  };
}
