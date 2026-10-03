import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useAgentRunState } from "./useAgentRunState";
import { decideProposal, getProposal, listProposals } from "@/services/agentRun";
import { readRunState, updateRunState } from "@/services/agentRunState";
/** Everything on screen is stale now, so refetch everything on screen.
 *
 *  An approved proposal is the one moment where a single click rewrites several
 *  unrelated parts of the campaign at once — this one changed the brief, the
 *  strategy and the creative direction together — and it is the only write in
 *  the product that happens with **no run attached**, so no `data_changed`
 *  event exists to say what moved. The client is on its own.
 *
 *  It used to name the keys: `['campaign']`, `['creative']`, `['assets']` and a
 *  few more, through `invalidateForDataChange`. That list has to stay in step
 *  with every query key in the app, by hand, forever — and it already was not.
 *  `['campaign']` does not match `['campaign-tasks', …]`, which is how the
 *  canvas reads the task board, and nothing covered `['chat-messages', …]` or
 *  `['asset-folders', …]` either. Each of those is a surface that would sit on
 *  stale data until the page was reloaded, and the next key anyone adds joins
 *  them silently.
 *
 *  So: no key. `invalidateQueries()` with no filter marks every query stale and
 *  refetches the active ones. The cost is a handful of requests on a button the
 *  user just pressed and is waiting on, which is the cheapest moment in the
 *  whole product to spend them — and it cannot miss a key, now or later.
 *
 *  `data_changed` during a run keeps its targeted mapping: those arrive many
 *  times per turn, where being precise is worth the maintenance. */
function refetchEverything(queryClient: QueryClient) {
  void queryClient.invalidateQueries();
}

/** A message that says yes and nothing else.
 *
 *  Anchored at both ends deliberately. Anything carrying further instruction —
 *  "yes but make it warmer", "go ahead and also change the palette" — falls
 *  through to an ordinary turn, because the stored payload is not what they
 *  just described. */
const AFFIRMATIVE =
  /^\s*(?:yes|yep|yeah|yup|ok|okay|sure|do it|go ahead|please go ahead|go for it|approve(?:d)?|apply(?: it)?|sounds good|looks good|perfect|confirm(?:ed)?)\s*[.!]*\s*$/i;

/** Decisions outlive a stream. Never treat a failed fetch as an empty list. */
export function useCampaignProposal(chatId?: string) {
  const { proposal, execution } = useAgentRunState(chatId);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const deciding = useRef(false);
  const epoch = useRef(0);
  const refresh = useCallback(async () => {
    if (!chatId) return;
    const version = ++epoch.current;
    const before = readRunState(chatId).proposal;
    try {
      const current = before ? await getProposal(chatId, before.proposal_id) : undefined;
      const open = await listProposals(chatId);
      if (version !== epoch.current || readRunState(chatId).proposal !== before) return;
      const next = open[0] ?? current;
      updateRunState(chatId, { proposal: next });
      if (current?.status !== before?.status && current?.status === "applied") {
        refetchEverything(queryClient);
      }
      setError(null);
    } catch (err) {
      if (version === epoch.current) setError(err instanceof Error ? err.message : "Could not check suggestions.");
    }
  }, [chatId, queryClient]);
  const invalidateRequests = useCallback(() => { ++epoch.current; }, []);
  useEffect(() => {
    setError(null);
    void refresh();
    const focus = () => { void refresh(); };
    window.addEventListener("focus", focus);
    return () => { invalidateRequests(); window.removeEventListener("focus", focus); };
  }, [refresh, execution?.state, invalidateRequests]);
  useEffect(() => {
    if (!proposal || !["pending", "approved"].includes(proposal.status ?? "pending")) return;
    const timer = window.setInterval(() => { void refresh(); }, 4000);
    return () => window.clearInterval(timer);
  }, [proposal, refresh]);
  const decide = useCallback(async (decision: "approve" | "decline") => {
    if (!chatId || !proposal || deciding.current) return;
    deciding.current = true; setBusy(true); setError(null); ++epoch.current;
    const currentChat = chatId;
    try {
      const outcome = await decideProposal(currentChat, proposal.proposal_id, decision, proposal.content_hash);
      const current = readRunState(currentChat).proposal;
      if (current?.proposal_id === proposal.proposal_id) {
        updateRunState(currentChat, { proposal: { ...current, ...outcome } });
      }
      if (outcome.status === "applied" || outcome.result?.applied?.length) {
        refetchEverything(queryClient);
      }
      return outcome;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record that decision.");
    } finally { deciding.current = false; setBusy(false); }
  }, [chatId, proposal, queryClient]);
  /** Answering the open card by typing, rather than by clicking it.
   *
   *  The tester typed "Please go ahead" at a system that could not hear it:
   *  `approval.py` authorizes a change by finding its new value in the message,
   *  and "go ahead" contains no value, so the turn cost credits and changed
   *  nothing while the card sat there until it expired.
   *
   *  Only a **bare** affirmative counts. "yes but make it warmer" and "go ahead
   *  and also change the palette" carry a new instruction, so they are ordinary
   *  messages — approving the stored payload would be approving something other
   *  than what they just asked for.
   *
   *  It goes through `decide`, so it is the same hash-bound server route a
   *  click uses: approval still applies the payload stored when the card was
   *  raised, and a stale or superseded card is still refused. */
  const approveIfAffirmative = useCallback(async (text: string) => {
    if (!proposal || (proposal.status ?? "pending") !== "pending") return false;
    if (!AFFIRMATIVE.test(text)) return false;
    await decide("approve");
    return true;
  }, [proposal, decide]);

  return { proposal, error, busy, refresh, decide, approveIfAffirmative };
}
