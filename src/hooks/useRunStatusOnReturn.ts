import { useEffect, useRef } from "react";
import { getRunStatus } from "@/services/agentRun";

/**
 * Re-read the conversation's run status when the person comes back to this tab.
 *
 * Run state lives in this tab's memory and was only read from the server when
 * the chat first opened. So a tab left on a failed turn kept saying "This
 * request couldn't finish" after a later turn, sent from another tab, had
 * worked: the messages refreshed on focus and the strip did not (issue #137).
 *
 * `getRunStatus` already stores whatever the server says is the newest run, so
 * reading it is enough to replace a stale failure with the success that
 * followed. When that newest run is still going, the surface is asked to rejoin
 * it through its usual path, so the strip follows it live instead of showing a
 * frozen "working".
 *
 * Silent on failure, unlike the mount-time read: being offline for a moment
 * while switching tabs must not paint "Connection lost" over a finished chat.
 * Skipped while this tab is streaming its own turn, which it already follows,
 * and checked again when the answer arrives: a message sent during the status
 * round trip starts a stream the rejoin would otherwise abort.
 */
export function useRunStatusOnReturn(
  chatId: string | undefined,
  isStreaming: boolean,
  rejoin: () => void,
) {
  const streaming = useRef(isStreaming);
  streaming.current = isStreaming;
  useEffect(() => {
    if (!chatId) return;
    const onVisibility = () => {
      if (document.visibilityState !== "visible" || streaming.current) return;
      getRunStatus(chatId)
        .then((status) => { if (status.active && !streaming.current) rejoin(); })
        .catch(() => undefined);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [chatId, rejoin]);
}
