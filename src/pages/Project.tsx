import { useState, useEffect } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ProjectHeader } from "@/components/app/ProjectHeader";
import { ProjectTabs, ProjectTab } from "@/components/app/ProjectTabs";
import { OverviewTab } from "@/components/app/tabs/OverviewTab";
import { BriefTab } from "@/components/app/tabs/BriefTab";
import { ResearchTab } from "@/components/app/tabs/ResearchTab";
import { StrategyTab } from "@/components/app/tabs/StrategyTab";
import { TasksTab } from "@/components/app/tabs/TasksTab";
import { AnalyticsTab } from "@/components/app/tabs/AnalyticsTab";
import { ProjectSettingsTab } from "@/components/app/tabs/ProjectSettingsTab";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { ProjectProvider } from "@/components/app/ProjectContext";
import { useModification } from "@/hooks/useModification";

export default function Project() {
  const { projectId } = useParams<{ projectId: string }>();
  
  const { user } = useAuth();
  const { setIsModifying } = useModification();
  
  // Get state from AppLayout via Outlet context - MUST be called before any returns
  const outletContext = useOutletContext<{ 
    isModifying?: boolean; 
    modifyingContext?: string | null;
    activeTab?: ProjectTab;
    selectedTaskId?: string | null;
    setActiveTab?: (tab: ProjectTab) => void;
    setSelectedTaskId?: (taskId: string | null) => void;
  }>();
  
  const isModifying = outletContext?.isModifying || false;
  const modifyingContext = outletContext?.modifyingContext || null;
  const activeTab = outletContext?.activeTab || 'overview';
  const selectedTaskId = outletContext?.selectedTaskId || null;
  const setActiveTab = outletContext?.setActiveTab || (() => {});
  const setSelectedTaskId = outletContext?.setSelectedTaskId || (() => {});
  
  // Get project info from the projects list
  const { data: projectsData, isLoading: projectsLoading } = useProjects();
  const project = projectsData?.projects.find(p => p.project_id === projectId);

  // DEBUG: Log project page state
  console.log('Project Page DEBUG:', {
    projectId,
    projectsLoading,
    hasProjectsData: !!projectsData,
    projectsCount: projectsData?.projects?.length,
    foundProject: !!project,
    activeTab,
  });

  // Reset modification state when project changes (tab reset handled in AppLayout)
  useEffect(() => {
    setIsModifying(false, null);
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Construct composite task ID if needed (user_id/project_id/task_id)
  const getCompositeTaskId = (taskId: string): string => {
    if (taskId.includes('/')) {
      // Already composite
      return taskId;
    }
    // Construct composite ID
    return `${user?.email || ''}/${projectId}/${taskId}`;
  };

  const handleTaskSelect = (taskId: string | null) => {
    if (taskId) {
      setSelectedTaskId(getCompositeTaskId(taskId));
    } else {
      setSelectedTaskId(null);
    }
  };

  if (projectsLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p className="text-muted-foreground">No project selected</p>
      </div>
    );
  }

  const renderTabContent = () => {
    // Check if modification applies to current view
    // For tasks tab with selected task, check if modifyingContext matches the task ID
    // Otherwise, check if it matches the active tab
    
    // Extract just the task ID from composite selectedTaskId for comparison
    let taskIdForComparison = null;
    if (selectedTaskId) {
      const parts = selectedTaskId.split('/');
      taskIdForComparison = parts[parts.length - 1];
    }
    
    const isCurrentViewModifying = 
      isModifying && 
      (modifyingContext === activeTab || 
       (activeTab === 'tasks' && taskIdForComparison && modifyingContext === taskIdForComparison));
    
    const commonProps = {
      isModifying: isCurrentViewModifying,
    };

    switch (activeTab) {
      case 'overview':
        return <OverviewTab projectId={projectId} {...commonProps} />;
      case 'brief':
        return <BriefTab projectId={projectId} {...commonProps} />;
      case 'research':
        return <ResearchTab projectId={projectId} {...commonProps} />;
      case 'strategy':
        return <StrategyTab projectId={projectId} {...commonProps} />;
      case 'tasks':
        return (
          <TasksTab 
            projectId={projectId} 
            onTaskSelect={handleTaskSelect}
            {...commonProps}
          />
        );
      case 'analytics':
        return <AnalyticsTab {...commonProps} />;
      case 'settings':
        return <ProjectSettingsTab {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <ProjectProvider activeTab={activeTab} selectedTaskId={selectedTaskId}>
      <div className="min-h-full p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <ProjectHeader 
              title={project?.title || 'Project'} 
              lastModified={project?.last_modified}
            />
            
            <ProjectTabs 
              activeTab={activeTab} 
              onTabChange={(tab) => {
                setActiveTab(tab);
                // Clear task selection when switching away from tasks tab
                if (tab !== 'tasks') {
                  setSelectedTaskId(null);
                }
              }} 
            />
            
            {renderTabContent()}
          </div>
        </div>
    </ProjectProvider>
  );
}
