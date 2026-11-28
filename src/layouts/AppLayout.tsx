import { useState, useEffect, useCallback, useMemo } from "react";
import { Outlet, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/app/Sidebar";
import { AICopilotPanel } from "@/components/app/AICopilotPanel";
import { ModificationProvider } from "@/components/app/ModificationContext";
import { AutoMessageProvider } from "@/contexts/AutoMessageContext";
import { getChat } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useCheckoutReturn } from "@/hooks/useCheckoutReturn";
import { useProjects } from "@/hooks/useProjects";
import { useBalance, usePlan, useUsage } from "@/hooks/useBilling";
import { WelcomeGuide } from "@/components/app/WelcomeGuide";
import type { CampaignTab } from "@/components/app/CampaignTabs";

export function AppLayout() {
  // Stripe returns to /app, so this is the only place that sees it.
  useCheckoutReturn();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [copilotCollapsed, setCopilotCollapsed] = useState(false);
  const [isModifying, setIsModifyingState] = useState(false);
  const [modifyingContext, setModifyingContextState] = useState<string | null>(null);
  const [welcomeDismissed, setWelcomeDismissed] = useState(true);
  const [welcomeDismissalReady, setWelcomeDismissalReady] = useState(false);
  const [welcomePreviewClosed, setWelcomePreviewClosed] = useState(false);
  
  // Shared state for active tab and selected task - lifted for AETEA Copilot context detection
  const [activeTab, setActiveTab] = useState<CampaignTab>('brief');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  const { chatId, taskId } = useParams<{ chatId?: string; taskId?: string }>();
  const location = useLocation();
  const welcomePreview =
    import.meta.env.DEV && new URLSearchParams(location.search).get("welcomePreview") === "1";
  const { user } = useAuth();
  const { data: projects, isLoading: projectsLoading, isError: projectsError } = useProjects();
  const { data: balance, isLoading: balanceLoading, isError: balanceError } = useBalance();
  const { data: plan, isLoading: planLoading, isError: planError } = usePlan();
  const { data: usage, isLoading: usageLoading, isError: usageError } = useUsage(1);
  const welcomeDismissalKey = useMemo(() => {
    if (!user?.id || !user.last_sign_in_at) return null;
    return `aetea-welcome-dismissed:${user.id}:${user.last_sign_in_at}`;
  }, [user?.id, user?.last_sign_in_at]);
  const hasStartedWork = (projects?.chats?.length ?? 0) > 0;
  const hasAddedCredits =
    (balance?.credits ?? 0) > 0 ||
    (balance?.expired_credits ?? 0) > 0 ||
    Boolean(plan?.plan_id || plan?.status) ||
    (usage?.some((event) => event.credits_charged > 0) ?? false);
  const onboardingLoading = projectsLoading || balanceLoading || planLoading || usageLoading;
  const onboardingError = projectsError || balanceError || planError || usageError;
  const hasCompletedOnboarding = hasAddedCredits && hasStartedWork;

  useEffect(() => {
    if (!welcomeDismissalKey) {
      setWelcomeDismissed(true);
      setWelcomeDismissalReady(false);
      return;
    }
    setWelcomeDismissed(sessionStorage.getItem(welcomeDismissalKey) === "1");
    setWelcomeDismissalReady(true);
  }, [welcomeDismissalKey]);

  const showWelcomeGuide = (welcomePreview && !welcomePreviewClosed) || (
    location.pathname === "/app" &&
    welcomeDismissalReady &&
    !welcomeDismissed &&
    !onboardingLoading &&
    !onboardingError &&
    !hasCompletedOnboarding
  );

  const dismissWelcomeGuide = useCallback(() => {
    if (welcomePreview) setWelcomePreviewClosed(true);
    if (welcomeDismissalKey) sessionStorage.setItem(welcomeDismissalKey, "1");
    setWelcomeDismissed(true);
  }, [welcomeDismissalKey, welcomePreview]);
  const { data: chatData } = useQuery({
    queryKey: ["chat", chatId, user?.email],
    queryFn: () => getChat(chatId!),
    enabled: !!chatId && !!user?.email,
  });
  const campaignId = chatData?.campaign_id;
  const hasCampaign = !!campaignId;

  // Handler that updates modification state - shared between AICopilotPanel and Project
  // Wrapped in useCallback to prevent recreating on every render
  const handleModification = useCallback((isModifying: boolean, context: string | null) => {
    setIsModifyingState(isModifying);
    setModifyingContextState(context);
  }, []); // Empty deps - this function never needs to change

  // Reset all state when chat changes
  useEffect(() => {
    if (!chatId) {
      setIsModifyingState(false);
      setModifyingContextState(null);
      setActiveTab('brief');
      setSelectedTaskId(null);
    } else {
      // Reset to brief when switching chats
      setActiveTab('brief');
      setSelectedTaskId(null);
    }
  }, [chatId]);

  return (
    <ModificationProvider setIsModifying={handleModification}>
      <AutoMessageProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Left Sidebar - hidden on the canvas view (task open); canvas has its own Back button */}
        {!taskId && (
          <Sidebar 
            collapsed={sidebarCollapsed} 
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
            showOnboardingCue={showWelcomeGuide}
            previewOnboarding={welcomePreview}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <Outlet 
            context={{
              isModifying,
              modifyingContext,
              activeTab,
              selectedTaskId,
              setActiveTab,
              setSelectedTaskId,
            }}
          />
        </main>

        {/* Right AETEA panel - Only show when chat is open and has a campaign (Campaign view) */}
        {chatId && hasCampaign && !taskId && (
          <AICopilotPanel 
            chatId={chatId}
            campaignId={campaignId}
            activeTab={activeTab}
            selectedTaskId={selectedTaskId}
            collapsed={copilotCollapsed} 
            onToggle={() => setCopilotCollapsed(!copilotCollapsed)} 
          />
        )}
        <WelcomeGuide open={showWelcomeGuide} onClose={dismissWelcomeGuide} />
      </div>
      </AutoMessageProvider>
    </ModificationProvider>
  );
}
