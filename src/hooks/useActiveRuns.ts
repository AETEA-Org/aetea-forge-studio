import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { listActiveRuns, type ActiveRun } from "@/services/agentRun";

/** No deliverable is busy. A stable object, so `useMemo` downstream holds. */
const NONE: { runs: ActiveRun[]; limit: number } = { runs: [], limit: 0 };

/**
 * What every deliverable in this chat is doing.
 *
 * Polled rather than streamed. Following N deliverables would mean N SSE
 * connections from one page, and the campaign page needs a state per card
 * rather than a token stream — the canvas is where a run is watched in detail.
 *
 * The interval moves with what is happening: about three seconds while
 * anything is running, half a minute when nothing is. A campaign page left
 * open on a finished campaign is the common case and should not poll like a
 * busy one. Polling stops entirely while the tab is in the background, which
 * is react-query's default.
 */
export function useActiveRuns(chatId?: string) {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["active-runs", chatId, user?.email],
    queryFn: () => listActiveRuns(chatId!),
    enabled: !!chatId && !!user?.email,
    refetchInterval: (q) => ((q.state.data?.runs.length ?? 0) > 0 ? 3_000 : 30_000),
    // A failed poll must never read as "nothing is running": that would wipe
    // every chip on a flaky connection and tell the person their work stopped.
    placeholderData: (previous) => previous,
  });
  return query.data ?? NONE;
}

/** The run for one deliverable, or undefined when it is not running. */
export function runForScope(runs: ActiveRun[], scope: string): ActiveRun | undefined {
  return runs.find((run) => run.scope === scope);
}
