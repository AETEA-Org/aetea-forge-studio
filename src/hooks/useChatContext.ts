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

  // If we're in tasks tab and a task is selected, use task_id
  if (activeTab === 'tasks' && selectedTaskId) {
    // Extract only the task_id portion (last part of composite ID)
    // Composite format: user_id/project_id/task_id
    const taskIdParts = selectedTaskId.split('/');
    const taskId = taskIdParts[taskIdParts.length - 1];
    
    return {
      context: taskId,
      contextLabel: `Task: ${taskId.slice(0, 8)}...`,
    };
  }

  // Otherwise, use the active tab name
  const context = activeTab || 'brief';
  const contextLabels: Record<ProjectTab, string> = {
    brief: 'Brief',
    research: 'Research',
    strategy: 'Strategy',
    tasks: 'Tasks',
    analytics: 'Analytics',
    settings: 'Settings',
  };

  return {
    context: context,
    contextLabel: contextLabels[context] || 'Brief',
  };
}
