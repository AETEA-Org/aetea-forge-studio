import { useCallback, useSyncExternalStore } from "react";
import { readRunState, subscribeRunState } from "@/services/agentRunState";

/**
 * This surface's run, live.
 *
 * `scope` is a deliverable's task id, or omitted for the conversation. A
 * deliverable canvas must pass its own, or it reports on the conversation's run
 * instead of its own — and with two deliverables going at once those are
 * different answers.
 */
export function useAgentRunState(chatId?: string, scope?: string) {
  const subscribe = useCallback(
    (listener: () => void) => subscribeRunState(chatId ?? "", listener, scope),
    [chatId, scope]
  );
  const getSnapshot = useCallback(() => readRunState(chatId ?? "", scope), [chatId, scope]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
