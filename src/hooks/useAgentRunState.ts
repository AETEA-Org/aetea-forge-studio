import { useCallback, useSyncExternalStore } from "react";
import { readRunState, subscribeRunState } from "@/services/agentRunState";

export function useAgentRunState(chatId?: string) {
  const subscribe = useCallback((listener: () => void) => subscribeRunState(chatId ?? "", listener), [chatId]);
  const getSnapshot = useCallback(() => readRunState(chatId ?? ""), [chatId]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
