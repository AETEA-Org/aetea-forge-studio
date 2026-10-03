import { useEffect, useState } from "react";
import { AgentThinking } from "./AgentThinking";
import { AgentSteps } from "./AgentSteps";
import { useAgentRunState } from "@/hooks/useAgentRunState";
import type { ProgressStep, RunConnectionState } from "@/services/agentRun";

/** Execution and connection health are distinct. Never guess a percentage. */
export function AgentProgress({ chatId, isStreaming, thinkingText, steps, connection, onReconnect, onStop, onReview }: {
  chatId?: string;
  isStreaming?: boolean;
  thinkingText: string;
  steps: ProgressStep[];
  connection?: RunConnectionState;
  onReconnect?: () => void;
  onStop?: () => void;
  onReview?: () => void;
}) {
  const { execution, tier } = useAgentRunState(chatId);
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const state = execution?.state;
  const failed = state === "failed";
  const ended = failed || state === "stopped" || state === "completed";
  const active = isStreaming || connection === "connected" || connection === "reconnecting";
  const quiet = execution && !ended && now - Date.parse(execution.meaningful_activity_at) >= 120_000;
  const retryVisible = state === "retrying" && now - Date.parse(execution?.state_changed_at ?? "") >= 5000;
  const labels: Record<string, string> = {
    starting: "Getting started…", working: "Working on your request…",
    render_slot: "Waiting for a video slot…", video: "Your video is being made…",
    approval: "Waiting for your go-ahead", retry: "Trying that step again…",
    stalled: "This request stopped responding. Your saved work is kept.",
    interrupted: "This request was interrupted. Your saved work is kept.",
    failed: "This request couldn't finish. Your saved work is kept.",
    stopped: "Stopped. Your saved work is kept.", completed: "Finished",
  };
  let label = labels[execution?.reason ?? ""] ?? labels.working;
  if (state === "working" && execution?.reason === "working") label = execution.active_steps.at(-1)?.label ?? label;
  if (!execution && active && !steps.length && !thinkingText) label = "Getting started…";
  if (quiet && state === "working") label = "No new update yet. You can wait or stop this request.";
  if (state === "retrying" && !retryVisible) label = "Working on your request…";
  if (connection === "stopping") label = "Stopping…";
  else if (!ended && connection === "interrupted") label = "Connection lost. Your work may still be running.";
  else if (!ended && connection === "reconnecting") label = "Reconnecting to your request…";
  // A brief confirmed success is enough; unresolved errors/decisions stay.
  if (!active && !execution && !steps.length && !thinkingText) return null;
  if (state === "completed" && now - Date.parse(execution?.state_changed_at ?? "") > 6000) return null;
  const activity = steps.length > 0 || !!thinkingText.trim() || !!tier;
  return (
    <div className="chat-scrollbar nodrag nowheel min-h-0 max-h-[40%] shrink overflow-y-auto px-3 pb-2" aria-label="Run progress">
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
        <div className="flex flex-wrap items-center gap-x-3">
          <p className="min-w-0 flex-1" role="status" aria-live="polite">{label}</p>
          {connection === "interrupted" && !ended && <button type="button" onClick={onReconnect} className="min-h-11 underline">Reconnect</button>}
          {failed && onReview && <button type="button" onClick={onReview} className="min-h-11 underline">Review request</button>}
          {!ended && (quiet || connection === "interrupted") && <button type="button" onClick={onStop} className="min-h-11 underline">Stop</button>}
          {activity && <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} className="min-h-11 underline">{expanded ? "Hide activity" : "Show activity"}</button>}
        </div>
        {failed && !isStreaming && <p className="mt-1 text-muted-foreground">Review restores your text. Reattach files after a refresh.</p>}
        {execution?.committed_generation && (connection === "stopping" || state === "stopped") && <p className="mt-1 text-muted-foreground">A video already started may finish. No further clips will be ordered.</p>}
      </div>
      {expanded && <div className="mt-2 space-y-2">{tier && <p className="text-xs text-muted-foreground">Intelligence: {tier}</p>}<AgentThinking text={thinkingText} /><AgentSteps steps={steps} /></div>}
    </div>
  );
}
