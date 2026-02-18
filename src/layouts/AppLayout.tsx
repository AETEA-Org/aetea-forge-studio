import { useState, useEffect, useCallback } from "react";
import { Outlet, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/app/Sidebar";
import { AICopilotPanel } from "@/components/app/AICopilotPanel";
import { ModificationProvider } from "@/components/app/ModificationContext";
import { AutoMessageProvider } from "@/contexts/AutoMessageContext";
import { getChat } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import type { CampaignTab } from "@/components/app/CampaignTabs";

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [copilotCollapsed, setCopilotCollapsed] = useState(false);
  const [isModifying, setIsModifyingState] = useState(false);
  const [modifyingContext, setModifyingContextState] = useState<string | null>(null);
  
  // Shared state for active tab and selected task - lifted for AI Copilot context detection
  const [activeTab, setActiveTab] = useState<CampaignTab>('brief');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  const { chatId } = useParams<{ chatId?: string }>();
  const { user } = useAuth();
  const { data: chatData } = useQuery({
    queryKey: ["chat", chatId, user?.email],
    queryFn: () => getChat(chatId!, user!.email!),
    enabled: !!chatId && !!user?.email,
  });
  const hasCampaign = !!chatData?.campaign_id;

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
        {/* Left Sidebar */}
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />

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

        {/* Right AI Panel - Only show when chat is open and has a campaign (Campaign view) */}
        {chatId && hasCampaign && (
          <AICopilotPanel 
            chatId={chatId}
            activeTab={activeTab}
            selectedTaskId={selectedTaskId}
            collapsed={copilotCollapsed} 
            onToggle={() => setCopilotCollapsed(!copilotCollapsed)} 
          />
        )}
      </div>
      </AutoMessageProvider>
    </ModificationProvider>
  );
}
