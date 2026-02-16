import { createContext, useContext, ReactNode } from "react";
import type { CampaignTab } from "@/components/app/CampaignTabs";

interface CampaignContextValue {
  activeTab: CampaignTab;
  selectedTaskId: string | null;
}

const CampaignContext = createContext<CampaignContextValue | undefined>(undefined);

interface CampaignProviderProps {
  children: ReactNode;
  activeTab: CampaignTab;
  selectedTaskId: string | null;
}

export function CampaignProvider({ children, activeTab, selectedTaskId }: CampaignProviderProps) {
  return (
    <CampaignContext.Provider value={{ activeTab, selectedTaskId }}>
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaignContext() {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error("useCampaignContext must be used within CampaignProvider");
  }
  return context;
}
