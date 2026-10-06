import { useState, useEffect, useCallback } from "react";
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

/** How long to wait for a target section to render before abandoning the jump. */
const SECTION_SCROLL_TIMEOUT_MS = 15000;

/** How long to keep correcting the jump while the rest of the tab fills in.
 *
 *  A smooth scroll animates toward the position the target held when it started.
 *  The sections above it are still rendering, so the target slides further down
 *  mid-flight and the jump lands short — on whichever section is above it. That
 *  is the whole of the "KPI button opens Insight" report: `strategy-kpis` is the
 *  last section in the tab, so it has the most still to render above it and misses
 *  by the most. */
const SECTION_SETTLE_MS = 1200;

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
  const setActiveTab = outletContext?.setActiveTab;
  const [pendingScroll, setPendingScroll] = useState<{
    tab: CampaignTab;
    sectionId: string;
  } | null>(null);

  const navigateToSection = useCallback((tab: CampaignTab, sectionId: string) => {
    setPendingScroll({ tab, sectionId });
    setActiveTab?.(tab);
  }, [setActiveTab]);
  
  // Fetch chat to get campaign_id
  const { data: chatData, isLoading: chatLoading } = useQuery({
    queryKey: ['chat', chatId, user?.email],
    queryFn: () => getChat(chatId!),
    enabled: !!chatId && !!user?.email,
  });

  // Fetch campaign if chat has campaign_id
  const { data: campaignData, isLoading: campaignLoading } = useQuery({
    queryKey: ['campaign', chatData?.campaign_id, user?.email],
    queryFn: () => getCampaignById(chatData!.campaign_id!),
    enabled: !!chatId && !!user?.email && !!chatData?.campaign_id,
  });

  // Reset modification state when chat changes (tab reset handled in AppLayout)
  useEffect(() => {
    setIsModifying(false, null);
  }, [chatId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!pendingScroll || pendingScroll.tab !== activeTab) return;

    let settled = false;
    let keepUp: MutationObserver | null = null;
    let settleTimer: number | undefined;

    const scrollIfReady = () => {
      if (settled) return true;
      const target = document.getElementById(pendingScroll.sectionId);
      if (!target) return false;
      settled = true;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Correct the jump while the tab is still growing above the target.
      // `offsetTop` is measured against the offset parent rather than the
      // viewport, so it is unaffected by scrolling and moves only when content
      // above the target actually changes height — which means this re-aims
      // exactly when the miss is being caused and never fights a user who has
      // started scrolling somewhere else.
      let lastTop = target.offsetTop;
      keepUp = new MutationObserver(() => {
        if (target.offsetTop === lastTop) return;
        lastTop = target.offsetTop;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      keepUp.observe(document.body, { childList: true, subtree: true });
      settleTimer = window.setTimeout(() => keepUp?.disconnect(), SECTION_SETTLE_MS);

      setPendingScroll(null);
      return true;
    };

    if (scrollIfReady()) {
      return () => {
        keepUp?.disconnect();
        window.clearTimeout(settleTimer);
      };
    }

    // A tab only renders its sections once its own query resolves, which can take
    // longer than any fixed poll window — watching the DOM means the jump lands
    // whenever the section appears instead of silently giving up at the top.
    const observer = new MutationObserver(() => {
      if (scrollIfReady()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const giveUp = window.setTimeout(() => {
      observer.disconnect();
      if (!settled) setPendingScroll(null);
    }, SECTION_SCROLL_TIMEOUT_MS);

    return () => {
      observer.disconnect();
      keepUp?.disconnect();
      window.clearTimeout(giveUp);
      window.clearTimeout(settleTimer);
    };
  }, [activeTab, pendingScroll]);

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
    // Check if modification applies to current view.
    // modifyingContext can be 'tab:creative', 'tab:brief', etc. (API context) or 'task:xyz' (task under creative)
    const contextTab =
      modifyingContext?.startsWith('tab:')
        ? modifyingContext.slice(5)
        : modifyingContext?.startsWith('task:')
          ? 'creative'
          : modifyingContext;
    const isCurrentViewModifying =
      isModifying && contextTab != null && contextTab === activeTab;
    
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
        return (
          <CreativeTab
            campaignId={campaignId}
            chatId={chatId!}
            onNavigateToSection={navigateToSection}
            {...commonProps}
          />
        );
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
                setActiveTab?.(tab);
              }} 
            />
            
            {renderTabContent()}
          </div>
        </div>
    </CampaignProvider>
  );
}
