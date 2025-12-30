import { useQuery } from "@tanstack/react-query";
import { getProjectSection } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import type { 
  SectionName, 
  OverviewModel, 
  BriefModel, 
  ResearchModel, 
  StrategyModel,
  SectionResponse 
} from "@/types/api";

// Generic hook for any section
export function useProjectSection<T>(projectId: string | undefined, section: SectionName) {
  const { user } = useAuth();
  const userEmail = user?.email;

  return useQuery({
    queryKey: ['project', projectId, section, userEmail],
    queryFn: () => getProjectSection<T>(projectId!, section, userEmail!),
    enabled: !!projectId && !!userEmail,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Convenience hooks for specific sections
export function useProjectOverview(projectId: string | undefined) {
  return useProjectSection<OverviewModel>(projectId, 'overview');
}

export function useProjectBrief(projectId: string | undefined) {
  return useProjectSection<BriefModel>(projectId, 'brief');
}

export function useProjectResearch(projectId: string | undefined) {
  return useProjectSection<ResearchModel>(projectId, 'research');
}

export function useProjectStrategy(projectId: string | undefined) {
  return useProjectSection<StrategyModel>(projectId, 'strategy');
}
