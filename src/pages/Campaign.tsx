import { useState, useEffect } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { CampaignHeader } from "@/components/app/CampaignHeader";
import { CampaignTabs, CampaignTab } from "@/components/app/CampaignTabs";
import { BriefTab } from "@/components/app/tabs/BriefTab";
import { AssetsTab } from "@/components/app/tabs/AssetsTab";
import { ResearchTab } from "@/components/app/tabs/ResearchTab";
import { StrategyTab } from "@/components/app/tabs/StrategyTab";
import { CreativeTab } from "@/components/app/tabs/CreativeTab";
import { AnalyticsTab } from "@/components/app/tabs/AnalyticsTab";
import { CampaignSettingsTab } from "@/components/app/tabs/CampaignSettingsTab";
import { useAuth } from "@/hooks/useAuth";
import { CampaignProvider } from "@/components/app/CampaignContext";
import { useModification } from "@/hooks/useModification";
import { useQuery } from "@tanstack/react-query";
import { getChat, getCampaignById } from "@/services/api";
import type { ChatOrCampaignOutletContext } from "@/pages/ChatOrCampaign";

interface CampaignProps {
  outletContext?: ChatOrCampaignOutletContext | null;
}

export default function Campaign({ outletContext: outletContextProp }: CampaignProps = {}) {
  const { chatId } = useParams<{ chatId: string }>();
  
  const { user } = useAuth();
  const { setIsModifying } = useModification();
  
  const contextFromOutlet = useOutletContext<ChatOrCampaignOutletContext>();
  const outletContext = outletContextProp ?? contextFromOutlet;
  
  const isModifying = outletContext?.isModifying || false;
  const modifyingContext = outletContext?.modifyingContext || null;
  const activeTab = outletContext?.activeTab || 'brief';
  const selectedTaskId = outletContext?.selectedTaskId || null;
  const setActiveTab = outletContext?.setActiveTab || (() => {});
  const setSelectedTaskId = outletContext?.setSelectedTaskId || (() => {});
  
  // Fetch chat to get campaign_id
  const { data: chatData, isLoading: chatLoading } = useQuery({
    queryKey: ['chat', chatId, user?.email],
    queryFn: () => getChat(chatId!, user!.email!),
    enabled: !!chatId && !!user?.email,
  });

  // Fetch campaign if chat has campaign_id
  const { data: campaignData, isLoading: campaignLoading } = useQuery({
    queryKey: ['campaign', chatData?.campaign_id, user?.email],
    queryFn: () => getCampaignById(chatData!.campaign_id!, user!.email!),
    enabled: !!chatId && !!user?.email && !!chatData?.campaign_id,
  });

  // Reset modification state when chat changes (tab reset handled in AppLayout)
  useEffect(() => {
    setIsModifying(false, null);
  }, [chatId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (chatLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!chatId) {
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

    // Only render tabs if campaign exists
    if (!campaignData?.campaign.id) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No campaign found for this chat</p>
        </div>
      );
    }

    const campaignId = campaignData.campaign.id;

    switch (activeTab) {
      case 'brief':
        return <BriefTab campaignId={campaignId} {...commonProps} />;
      case 'asset':
        return <AssetsTab chatId={chatId} {...commonProps} />;
      case 'research':
        return <ResearchTab campaignId={campaignId} {...commonProps} />;
      case 'strategy':
        return <StrategyTab campaignId={campaignId} {...commonProps} />;
      case 'creative':
        return <CreativeTab campaignId={campaignId} chatId={chatId!} {...commonProps} />;
      case 'analytics':
        return <AnalyticsTab {...commonProps} />;
      case 'settings':
        return <CampaignSettingsTab {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <CampaignProvider activeTab={activeTab} selectedTaskId={selectedTaskId}>
      <div className="min-h-full p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <CampaignHeader 
              title={campaignData?.campaign.title || chatData?.title || 'Chat'} 
              lastModified={campaignData?.campaign.updated_at || chatData?.last_modified}
            />
            
            <CampaignTabs 
              activeTab={activeTab} 
              onTabChange={(tab) => {
                setActiveTab(tab);
              }} 
            />
            
            {renderTabContent()}
          </div>
        </div>
    </CampaignProvider>
  );
}
