import { useQuery } from "@tanstack/react-query";
import { listProjects } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

export function useProjects() {
  const { user } = useAuth();
  const userEmail = user?.email;

  return useQuery({
    queryKey: ['projects', userEmail],
    queryFn: () => listProjects(userEmail!),
    enabled: !!userEmail,
    staleTime: 1000 * 60, // 1 minute
  });
}
