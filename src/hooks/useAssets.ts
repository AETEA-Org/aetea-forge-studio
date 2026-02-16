import { useQuery } from "@tanstack/react-query";
import { getAssets } from "@/services/api";
import { useAuth } from "./useAuth";

export function useAssets(chatId: string | undefined, folderPath?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['assets', chatId, user?.email, folderPath],
    queryFn: () => {
      const result = getAssets(chatId!, user!.email!, folderPath);
      // Store fetch timestamp in query metadata for expiration checking
      return result.then((data) => ({
        ...data,
        _fetchedAt: Date.now(), // Store timestamp when fetched
      }));
    },
    enabled: !!chatId && !!user?.email,
  });
}
