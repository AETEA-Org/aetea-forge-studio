import { useState, useEffect } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ProjectHeader } from "@/components/app/ProjectHeader";
import { ProjectTabs, ProjectTab } from "@/components/app/ProjectTabs";
import { BriefTab } from "@/components/app/tabs/BriefTab";
import { AssetsTab } from "@/components/app/tabs/AssetsTab";
import { ResearchTab } from "@/components/app/tabs/ResearchTab";
import { StrategyTab } from "@/components/app/tabs/StrategyTab";
import { AnalyticsTab } from "@/components/app/tabs/AnalyticsTab";
import { ProjectSettingsTab } from "@/components/app/tabs/ProjectSettingsTab";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { ProjectProvider } from "@/components/app/ProjectContext";
import { useModification } from "@/hooks/useModification";
import { useQuery } from "@tanstack/react-query";
import { getChat, getCampaignByChatId } from "@/services/api";

export default function Project() {
  const { projectId, chatId } = useParams<{ projectId?: string; chatId?: string }>();
  const id = chatId || projectId; // Support both routes
  
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
  const activeTab = outletContext?.activeTab || 'brief';
  const selectedTaskId = outletContext?.selectedTaskId || null;
  const setActiveTab = outletContext?.setActiveTab || (() => {});
  const setSelectedTaskId = outletContext?.setSelectedTaskId || (() => {});
  
  // Fetch chat to get campaign_id
  const { data: chatData, isLoading: chatLoading } = useQuery({
    queryKey: ['chat', id, user?.email],
    queryFn: () => getChat(id!, user!.email!),
    enabled: !!id && !!user?.email,
  });

  // Fetch campaign if chat has campaign_id
  const { data: campaignData, isLoading: campaignLoading } = useQuery({
    queryKey: ['campaign', chatData?.campaign_id, user?.email],
    queryFn: () => getCampaignByChatId(id!, user!.email!),
    enabled: !!id && !!user?.email && !!chatData?.campaign_id,
  });

  // DEBUG: Log project page state
  console.log('Project Page DEBUG:', {
    id,
    chatId,
    projectId,
    chatLoading,
    campaignLoading,
    hasChatData: !!chatData,
    hasCampaignData: !!campaignData,
    campaignId: chatData?.campaign_id,
    activeTab,
  });

  // Reset modification state when project/chat changes (tab reset handled in AppLayout)
  useEffect(() => {
    setIsModifying(false, null);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (chatLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!id) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p className="text-muted-foreground">No chat selected</p>
      </div>
    );
  }

  const renderTabContent = () => {
    // Check if modification applies to current view
    const isCurrentViewModifying = 
      isModifying && 
      (modifyingContext === activeTab);
    
    const commonProps = {
      isModifying: isCurrentViewModifying,
    };

    switch (activeTab) {
      case 'brief':
        return <BriefTab projectId={id} {...commonProps} />;
      case 'asset':
        return <AssetsTab projectId={id} {...commonProps} />;
      case 'research':
        return <ResearchTab projectId={id} {...commonProps} />;
      case 'strategy':
        return <StrategyTab projectId={id} {...commonProps} />;
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
              title={campaignData?.campaign.title || chatData?.title || 'Chat'} 
              lastModified={campaignData?.campaign.updated_at || chatData?.last_modified}
            />
            
            <ProjectTabs 
              activeTab={activeTab} 
              onTabChange={(tab) => {
                setActiveTab(tab);
              }} 
            />
            
            {renderTabContent()}
          </div>
        </div>
    </ProjectProvider>
  );
}
