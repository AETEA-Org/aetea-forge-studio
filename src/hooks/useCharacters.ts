import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCharacter, getCharacters } from "@/services/api";
import { useAuth } from "./useAuth";

/** Saved subject identities. Polls while any character is still being prepared. */
export function useCharacters(enabled: boolean = true) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['characters', user?.email],
    queryFn: () => getCharacters(user!.email!),
    enabled: enabled && !!user?.email,
    refetchInterval: (query) =>
      query.state.data?.characters.some((c) => c.status === 'pending')
        ? 10000
        : false,
  });
}

export function useCreateCharacter() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      name: string;
      description: string;
      frontal_asset_id: string;
      angle_asset_ids?: string[];
    }) => createCharacter(user!.email!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters', user?.email] });
    },
  });
}
