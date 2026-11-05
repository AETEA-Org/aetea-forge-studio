import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { getChat, patchChat } from "@/services/api";

/** The default when a chat has never been sent on. */
export const DEFAULT_TIER = "auto";

type ChatRecord = Awaited<ReturnType<typeof getChat>>;

/** The intelligence tier for one chat, shared by every surface that can send on it.
 *
 *  **There is exactly one copy of this, and it lives in the query cache.** Four
 *  surfaces can start a billable turn — the chat view, the copilot panel, the
 *  deliverable canvas and the campaign canvas — and each used to hold its own
 *  `useState("auto")`. Only the chat view ever read the stored value back, so
 *  picking AETEA Max and then opening a deliverable silently ran the next turn on
 *  whatever Auto chose. The customer was told Max, billed for Auto's pick, and
 *  judged the output as Max's. That is the regression behind "the intelligence
 *  setting keeps reverting" and, we think, most of "quality is worse than before".
 *
 *  Reading through the `["chat", …]` query means the four surfaces cannot disagree:
 *  there is no second copy to drift. A change writes to the cache first, so every
 *  mounted picker moves together, and then persists, so a reload or a new session
 *  opens where the user left off.
 *
 *  The new-project page is deliberately not a caller. No chat exists there yet, so
 *  it holds its own choice and hands it to `createProject`, which is what puts the
 *  tier on the chat in the first place.
 */
export function useChatTier(chatId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["chat", chatId, user?.email];

  const { data } = useQuery({
    queryKey,
    queryFn: () => getChat(chatId!),
    enabled: !!chatId && !!user?.email,
    retry: false,
  });

  const tier = data?.tier ?? DEFAULT_TIER;

  const setTier = useCallback(
    (next: string) => {
      if (!chatId || next === tier) return;
      // Cache first: every mounted picker reads this, so they all move at once.
      queryClient.setQueryData(queryKey, (old: ChatRecord | undefined) =>
        old ? { ...old, tier: next } : old
      );
      // Then persist. On failure, refetch rather than leaving the pickers showing
      // a tier the next turn will not actually run on.
      void patchChat(chatId, { tier: next }).catch(() => {
        void queryClient.invalidateQueries({ queryKey });
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chatId, tier, queryClient, user?.email]
  );

  return { tier, setTier };
}
