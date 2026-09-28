import { useQuery } from "@tanstack/react-query";
import { getCampaignByChatId, getProjectSection } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { normalizeStrategyFromApi } from "@/lib/normalizeStrategySection";
import type { 
  BriefModel, 
  OverviewModel,
  ResearchModel, 
  StrategyModel,
  SectionResponse 
} from "@/types/api";

export function useProjectOverview(projectId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['project', projectId, 'overview', user?.email],
    queryFn: () => getProjectSection<OverviewModel>(projectId!, 'overview'),
    enabled: !!projectId && !!user?.email,
    staleTime: 1000 * 60 * 5,
  });
}

// Generic hook to get a campaign section
export function useCampaignSection<T>(
  chatId: string | undefined,
  section: 'brief' | 'research' | 'strategy'
) {
  const { user } = useAuth();
  const userEmail = user?.email;

  return useQuery({
    queryKey: ['campaign', chatId, section, userEmail],
    queryFn: async () => {
      const data = await getCampaignByChatId(chatId!);
      let content = data.sections[section] as T;
      if (section === "strategy") {
        content = normalizeStrategyFromApi(data.sections.strategy) as T;
      }
      return {
        content,
      } as SectionResponse<T>;
    },
    enabled: !!chatId && !!userEmail,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Convenience hooks for specific sections
export function useCampaignBrief(chatId: string | undefined) {
  return useCampaignSection<BriefModel>(chatId, 'brief');
}

export function useCampaignResearch(chatId: string | undefined) {
  return useCampaignSection<ResearchModel>(chatId, 'research');
}

export function useCampaignStrategy(chatId: string | undefined) {
  return useCampaignSection<StrategyModel>(chatId, 'strategy');
}
