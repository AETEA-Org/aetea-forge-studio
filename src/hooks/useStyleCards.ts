import { useQuery } from "@tanstack/react-query";
import { getStyleCards } from "@/services/api";

export function useStyleCards(limit: number = 30, offset: number = 0) {
  return useQuery({
    queryKey: ['style-cards', limit, offset],
    queryFn: () => getStyleCards(limit, offset),
    enabled: limit > 0, // Only fetch if limit > 0 (lazy loading)
    staleTime: 1000 * 60 * 60, // 1 hour - cache aggressively
  });
}
