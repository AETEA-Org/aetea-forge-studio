import { useQuery } from "@tanstack/react-query";
import { getCampaignById } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import type { 
  BriefModel, 
  ResearchModel, 
  StrategyModel,
  SectionResponse 
} from "@/types/api";

// Generic hook to get a campaign section by campaign ID
export function useCampaignSection<T>(
  campaignId: string | undefined,
  section: 'brief' | 'research' | 'strategy'
) {
  const { user } = useAuth();
  const userEmail = user?.email;

  return useQuery({
    queryKey: ['campaign', campaignId, section, userEmail],
    queryFn: async () => {
      const data = await getCampaignById(campaignId!, userEmail!);
      return {
        content: data.sections[section] as T,
      } as SectionResponse<T>;
    },
    enabled: !!campaignId && !!userEmail,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Convenience hooks for specific sections
export function useCampaignBrief(campaignId: string | undefined) {
  return useCampaignSection<BriefModel>(campaignId, 'brief');
}

export function useCampaignResearch(campaignId: string | undefined) {
  return useCampaignSection<ResearchModel>(campaignId, 'research');
}

export function useCampaignStrategy(campaignId: string | undefined) {
  return useCampaignSection<StrategyModel>(campaignId, 'strategy');
}
