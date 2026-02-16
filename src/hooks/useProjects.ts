import { useQuery } from "@tanstack/react-query";
import { listAllChats } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

export function useProjects() {
  const { user } = useAuth();
  const userEmail = user?.email;

  return useQuery({
    queryKey: ['chats', userEmail],
    queryFn: () => listAllChats(userEmail!),
    enabled: !!userEmail,
    staleTime: 1000 * 60, // 1 minute
  });
}
