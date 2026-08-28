import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  acceptCampaignMode,
  cancelRun,
  followRun,
  getRunStatus,
  startTurn,
  type AgentTurnHandlers,
  type AssetHint,
  type ProgressStep,
  type StartTurnRequest,
} from "@/services/agentRun";

interface UseAgentTurnOptions {
  chatId?: string;
  userEmail?: string;
  /** Called once the answer is final and persisted. */
  onComplete?: (answer: string) => void | Promise<void>;
  onAssets?: (assets: AssetHint[]) => void;
  onError?: (message: string) => void;
}

/**
 * Runs one agent turn and keeps the visible state for it.
 *
 * The run lives on the server, so this hook also re-attaches to one already in
 * progress when the component mounts — which is what makes refreshing the page
 * mid-answer harmless rather than destructive.
 */
export function useAgentTurn({
  chatId,
  userEmail,
  onComplete,
  onAssets,
  onError,
}: UseAgentTurnOptions) {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const [answer, setAnswer] = useState("");
  const [thinking, setThinking] = useState("");
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [modeProposal, setModeProposal] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setAnswer("");
    setThinking("");
    setSteps([]);
    setError(null);
  }, []);

  const refetch = useCallback(
    (entity: string) => {
      if (!chatId || !userEmail) return;
      if (entity === "asset") {
        queryClient.invalidateQueries({ queryKey: ["assets", chatId, userEmail] });
        queryClient.invalidateQueries({ queryKey: ["asset-folders", chatId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["campaign"] });
        queryClient.invalidateQueries({ queryKey: ["creative"] });
      }
    },
    [chatId, userEmail, queryClient]
  );

  const handlers = useCallback((): AgentTurnHandlers => ({
    onToken: (_delta, accumulated) => setAnswer(accumulated),
    onThinking: (_delta, accumulated) => setThinking(accumulated),
    onProgress: (step) =>
      setSteps((current) => {
        const existing = current.findIndex((s) => s.step_id === step.step_id);
        if (existing === -1) return [...current, step];
        const next = [...current];
        next[existing] = step;
        return next;
      }),
    onAssets: (assets) => onAssets?.(assets),
    onDataChanged: (entity) => refetch(entity),
    onCampaign: () => refetch("campaign"),
    onModeProposal: (rationale) => setModeProposal(rationale),
    onCancelled: () => setIsRunning(false),
    onComplete: async (final) => {
      setIsRunning(false);
      if (chatId) {
        await queryClient.refetchQueries({ queryKey: ["chat-messages", chatId] });
      }
      await onComplete?.(final);
      setAnswer("");
      setThinking("");
      setSteps([]);
    },
    onError: (message) => {
      setIsRunning(false);
      setError(message);
      onError?.(message);
    },
  }), [chatId, queryClient, refetch, onAssets, onComplete, onError]);

  /** Send a message and follow the answer. */
  const send = useCallback(
    async (request: Omit<StartTurnRequest, "chatId" | "userEmail">) => {
      if (!chatId || !userEmail) return;
      reset();
      setIsRunning(true);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        await startTurn({ ...request, chatId, userEmail });
        await followRun(chatId, userEmail, handlers(), { signal: controller.signal });
      } catch (err) {
        setIsRunning(false);
        const message =
          err instanceof Error ? err.message : "Could not send that message";
        setError(message);
        onError?.(message);
      }
    },
    [chatId, userEmail, reset, handlers, onError]
  );

  /** Stop the answer in progress; what was written is kept. */
  const stop = useCallback(async () => {
    if (!chatId || !userEmail) return;
    await cancelRun(chatId, userEmail);
    abortRef.current?.abort();
    setIsRunning(false);
    await queryClient.refetchQueries({ queryKey: ["chat-messages", chatId] });
  }, [chatId, userEmail, queryClient]);

  /** Accept the offer to turn this conversation into a campaign. */
  const acceptCampaign = useCallback(async () => {
    if (!chatId || !userEmail) return;
    await acceptCampaignMode(chatId, userEmail);
    setModeProposal(null);
    queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
  }, [chatId, userEmail, queryClient]);

  const declineCampaign = useCallback(() => setModeProposal(null), []);

  // Re-attach to a run already in flight, so a reload mid-answer picks the
  // response back up instead of appearing to have lost it.
  useEffect(() => {
    if (!chatId || !userEmail) return;
    let cancelled = false;
    const controller = new AbortController();

    getRunStatus(chatId, userEmail)
      .then((status) => {
        if (cancelled || !status.active) return;
        setIsRunning(true);
        return followRun(chatId, userEmail, handlers(), {
          signal: controller.signal,
          sinceEventId: 0,
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      controller.abort();
    };
    // Re-attaching is per conversation; handlers are stable enough within one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, userEmail]);

  useEffect(() => () => abortRef.current?.abort(), []);

  return {
    isRunning,
    answer,
    thinking,
    steps,
    modeProposal,
    error,
    send,
    stop,
    acceptCampaign,
    declineCampaign,
  };
}
