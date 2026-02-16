import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCreativeState, updateCreativeState } from "@/services/api";
import { useAuth } from "./useAuth";

export function useCreativeState(campaignId: string | undefined) {
  const { user } = useAuth();
  const userEmail = user?.email;

  return useQuery({
    queryKey: ['creative', campaignId, userEmail],
    queryFn: () => getCreativeState(campaignId!, userEmail!),
    enabled: !!campaignId && !!userEmail,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateCreativeState() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      campaignId,
      updates,
    }: {
      campaignId: string;
      updates: {
        selected_style_id?: string | null;
        visual_direction?: { reference_image_ids: string[] } | null;
      };
    }) => {
      if (!user?.email) {
        throw new Error('User not authenticated');
      }
      return updateCreativeState(campaignId, user.email, updates);
    },
    onSuccess: (data, variables) => {
      // Invalidate creative state query
      queryClient.invalidateQueries({
        queryKey: ['creative', variables.campaignId, user?.email],
      });
    },
  });
}
