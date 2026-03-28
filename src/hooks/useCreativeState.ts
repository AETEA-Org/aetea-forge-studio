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
        creative_truth?: {
          claims_rtbs: string[];
          ctas_specs: string[];
        } | null;
        creative_tone?: {
          concept: string;
          headline_sample: string;
          body_copy_sample: string;
        } | null;
        key_visual_asset_id?: string | null;
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
