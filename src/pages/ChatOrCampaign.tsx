import { useParams, useOutletContext } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getChat } from "@/services/api";
import Campaign from "@/pages/Campaign";
import ChatView from "@/pages/ChatView";
import type { CampaignTab } from "@/components/app/CampaignTabs";

export type ChatOrCampaignOutletContext = {
  isModifying?: boolean;
  modifyingContext?: string | null;
  activeTab?: CampaignTab;
  selectedTaskId?: string | null;
  setActiveTab?: (tab: CampaignTab) => void;
  setSelectedTaskId?: (taskId: string | null) => void;
};

export default function ChatOrCampaign() {
  const { chatId } = useParams<{ chatId: string }>();
  const outletContext = useOutletContext<ChatOrCampaignOutletContext>();
  const { user } = useAuth();

  const { data: chatData, isLoading, isError } = useQuery({
    queryKey: ["chat", chatId, user?.email],
    queryFn: () => getChat(chatId!, user!.email!),
    enabled: !!chatId && !!user?.email,
    retry: false,
  });

  if (isLoading) {
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

  if (!isError && chatData?.campaign_id) {
    return <Campaign outletContext={outletContext} />;
  }

  return <ChatView />;
}
