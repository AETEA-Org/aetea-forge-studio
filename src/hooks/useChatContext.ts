import { useParams } from "react-router-dom";
import type { ProjectTab } from "@/components/app/ProjectTabs";

interface UseChatContextProps {
  activeTab?: ProjectTab;
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
  const { projectId } = useParams<{ projectId: string }>();

  // Otherwise, use the active tab name with "tab:" prefix
  const tab = activeTab || 'brief';
  const context = `tab:${tab}`;
  const contextLabels: Record<ProjectTab, string> = {
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
