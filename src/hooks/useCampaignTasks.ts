import { useQuery } from "@tanstack/react-query";
import { getCampaignTasks } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

export function useCampaignTasks(campaignId: string | undefined) {
  const { user } = useAuth();
  const userEmail = user?.email;

  return useQuery({
    queryKey: ['campaign', campaignId, 'tasks', userEmail],
    queryFn: () => getCampaignTasks(campaignId!, userEmail!),
    enabled: !!campaignId && !!userEmail,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
