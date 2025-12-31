import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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

export default function Project() {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeTab, setActiveTab] = useState<ProjectTab>('overview');
  
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

  // Reset to overview tab when project changes
  useEffect(() => {
    setActiveTab('overview');
  }, [projectId]);

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
    switch (activeTab) {
      case 'overview':
        return <OverviewTab projectId={projectId} />;
      case 'brief':
        return <BriefTab projectId={projectId} />;
      case 'research':
        return <ResearchTab projectId={projectId} />;
      case 'strategy':
        return <StrategyTab projectId={projectId} />;
      case 'tasks':
        return <TasksTab projectId={projectId} />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'settings':
        return <ProjectSettingsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-full p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <ProjectHeader 
          title={project?.title || 'Project'} 
          lastModified={project?.last_modified}
        />
        
        <ProjectTabs 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
        
        {renderTabContent()}
      </div>
    </div>
  );
}
