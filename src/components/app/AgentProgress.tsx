import { useEffect, useState } from "react";
import { AgentThinking } from "./AgentThinking";
import { AgentSteps } from "./AgentSteps";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useAgentRunState } from "@/hooks/useAgentRunState";
import { headlineStep } from "@/lib/buildProgress";
import type { ProgressStep, RunConnectionState } from "@/services/agentRun";

/** Execution and connection health are distinct. Never guess a percentage. */
export function AgentProgress({ chatId, scope, isStreaming, thinkingText, steps, connection, onReconnect, onStop, onReview }: {
  chatId?: string;
  /** The deliverable this surface is showing, or the conversation when
   *  omitted. A canvas without it reports on the conversation's run. */
  scope?: string;
  isStreaming?: boolean;
  thinkingText: string;
  steps: ProgressStep[];
  connection?: RunConnectionState;
  onReconnect?: () => void;
  onStop?: () => void;
  onReview?: () => void;
}) {
  const { execution } = useAgentRunState(chatId, scope);
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
  // The stage when the turn has stages, otherwise the last step seen — and it
  // stays after that step finishes. `active_steps` empties between tool calls,
  // which is most of a turn, so leading with it meant the headline fell back to
  // "Working on your request…" repeatedly mid-run. See lib/buildProgress.ts.
  if (state === "working" && execution?.reason === "working") {
    label = headlineStep(steps)?.label ?? execution.active_steps.at(-1)?.label ?? label;
  }
  if (!execution && active && !steps.length && !thinkingText) label = "Getting started…";
  if (quiet && state === "working") label = "No new update yet. You can wait or stop this request.";
  if (state === "retrying" && !retryVisible) label = "Working on your request…";
  if (connection === "stopping") label = "Stopping…";
  else if (!ended && connection === "interrupted") label = "Connection lost. Your work may still be running.";
  else if (!ended && connection === "reconnecting") label = "Reconnecting to your request…";
  // A brief confirmed success is enough; unresolved errors/decisions stay.
  if (!active && !execution && !steps.length && !thinkingText) return null;
  if (state === "completed" && now - Date.parse(execution?.state_changed_at ?? "") > 6000) return null;
  // Which tier ran is deliberately not here. It is a setting the person
  // already chose in the composer, so repeating it mid-run tells them nothing
  // they did not decide — and on the campaign-building screen, where there are
  // no steps and no reasoning to show, it was the *only* thing behind "Show
  // activity": a button that promised activity and revealed one line of
  // internal vocabulary. Spend belongs on the billing screen, which itemises
  // it properly.
  const activity = steps.length > 0 || !!thinkingText.trim();
  // One box, one toggle. The status line itself opens it: a "Show activity"
  // button that revealed two more collapsibles was three borders and two
  // clicks away from anything worth reading.
  const Chevron = expanded ? ChevronDown : ChevronRight;
  return (
    <div className="chat-scrollbar nodrag nowheel min-h-0 max-h-[40%] shrink overflow-y-auto px-3 pb-2" aria-label="Run progress">
      <div className="rounded-lg border border-border bg-muted/30 text-xs">
        <div className="flex flex-wrap items-center gap-x-3 px-3 py-2">
          {activity ? (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              className="flex min-h-9 min-w-0 flex-1 items-center gap-2 text-left hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span className="min-w-0 flex-1 truncate" role="status" aria-live="polite">{label}</span>
              <Chevron className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          ) : (
            <p className="min-w-0 flex-1" role="status" aria-live="polite">{label}</p>
          )}
          {connection === "interrupted" && !ended && <button type="button" onClick={onReconnect} className="min-h-11 underline">Reconnect</button>}
          {failed && onReview && <button type="button" onClick={onReview} className="min-h-11 underline">Review request</button>}
          {!ended && (quiet || connection === "interrupted") && <button type="button" onClick={onStop} className="min-h-11 underline">Stop</button>}
        </div>
        {failed && !isStreaming && <p className="px-3 pb-2 text-muted-foreground">Review restores your text. Reattach files after a refresh.</p>}
        {execution?.committed_generation && (connection === "stopping" || state === "stopped") && <p className="px-3 pb-2 text-muted-foreground">A video already started may finish. No further clips will be ordered.</p>}
        {expanded && activity && (
          <>
            {steps.length > 0 && (
              <div className="border-t border-border px-3 py-2">
                <AgentSteps steps={steps} />
              </div>
            )}
            {/* Unchanged on purpose: the reasoning panel stays exactly as it
                was, one click in rather than two. */}
            {!!thinkingText.trim() && (
              <div className="border-t border-border">
                <AgentThinking text={thinkingText} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
