import { useQuery } from "@tanstack/react-query";
import { getProjectTasks } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

export function useProjectTasks(projectId: string | undefined) {
  const { user } = useAuth();
  const userEmail = user?.email;

  return useQuery({
    queryKey: ['project', projectId, 'tasks', userEmail],
    queryFn: () => getProjectTasks(projectId!, userEmail!),
    enabled: !!projectId && !!userEmail,
    staleTime: 1000 * 60, // 1 minute
  });
}
