import { useEffect, useState } from "react";
import { AgentThinking } from "./AgentThinking";
import { AgentSteps } from "./AgentSteps";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useAgentRunState } from "@/hooks/useAgentRunState";
import { headlineStep } from "@/lib/buildProgress";
import { FALLBACK_PATIENCE_SECONDS } from "@/services/agentRun";
import type { ProgressStep, RunConnectionState } from "@/services/agentRun";

/**
 * Reasons where the wait *is* the step's own work, so the step's own label
 * says more than the reason does.
 *
 * `approval`, `render_slot`, `video` and `retry` each name something outside
 * the step that it is waiting on, and there the reason is the news. A section
 * generation is only ever waiting on itself, so "Working out the strategy"
 * beats "Writing this part of the campaign…" — which is why that entry in
 * `labels` below is a fallback and not a replacement.
 */
const OWN_WORK_REASONS = new Set(["working", "section"]);

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
  const state = execution?.state;
  const failed = state === "failed";
  const ended = failed || state === "stopped" || state === "completed";
  // Only while there is something time-dependent left to recompute. It used to
  // run for as long as the strip was mounted, which is most of a session.
  const ticking = !!execution && !ended;
  useEffect(() => {
    if (!ticking) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [ticking]);
  // A completed strip hides itself six seconds later, and the clock above has
  // already stopped by then, so that one needs its own single wake-up.
  const completedAt = state === "completed" ? execution?.state_changed_at : undefined;
  useEffect(() => {
    if (!completedAt) return;
    const timer = window.setTimeout(
      () => setNow(Date.now()),
      Math.max(0, Date.parse(completedAt) + 6100 - Date.now())
    );
    return () => window.clearTimeout(timer);
  }, [completedAt]);
  const active = isStreaming || connection === "connected" || connection === "reconnecting";
  // One clock, and it is the server's. The browser holds no duration of its
  // own any more — it only asks whether an instant the server sent has passed.
  // `bounded_until` says "be patient until here", `patience_seconds` says "my
  // own budget is this long", and both come from the process that runs the
  // stall supervisor, so the screen and the supervisor cannot disagree about
  // policy. Before this, the browser gave up after two minutes while the
  // server was happy to wait fifteen.
  const patienceMs = (execution?.patience_seconds ?? FALLBACK_PATIENCE_SECONDS) * 1000;
  const boundedUntil = execution?.bounded_until ? Date.parse(execution.bounded_until) : null;
  const waiting = !!execution && !ended && boundedUntil !== null && now < boundedUntil;
  const quiet = !!execution && !ended && !waiting
    && now - Date.parse(execution.meaningful_activity_at) >= patienceMs;
  const patienceMinutes = Math.max(1, Math.round(patienceMs / 60_000));
  const retryVisible = state === "retrying" && now - Date.parse(execution?.state_changed_at ?? "") >= 5000;
  const labels: Record<string, string> = {
    starting: "Getting started…", working: "Working on your request…",
    render_slot: "Waiting for a video slot…", video: "Your video is being made…",
    approval: "Waiting for your go-ahead", retry: "Trying that step again…",
    section: "Writing this part of the campaign…",
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
  if (!ended && execution && OWN_WORK_REASONS.has(execution.reason)) {
    label = headlineStep(steps)?.label ?? execution.active_steps.at(-1)?.label ?? label;
  }
  if (!execution && active && !steps.length && !thinkingText) label = "Getting started…";
  // Only once the server's own patience is up, and it says how long rather
  // than "yet" — rendered from the same number, so the sentence cannot drift
  // from it. No longer gated on `state === "working"` either: a declared wait
  // that has *expired* and then gone silent for the whole budget is genuinely
  // stalled, and used to keep its own calm label for as long as it hung.
  // `quiet` already excludes a wait that has not expired.
  if (quiet) {
    label = `No new update for ${patienceMinutes} minute${patienceMinutes === 1 ? "" : "s"}. `
      + "You can keep waiting, or stop this request.";
  }
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
  // Not rendered at all during a declared wait, rather than rendered and
  // disabled. This line is the whole of the first half of the bug: it used to
  // read `quiet || connection === "interrupted"` and never looked at the
  // state, so every declared wait the backend has — the two approval waits,
  // the video poll, the render slot, the deliverable queue — handed the person
  // a Stop button at two minutes. Pressing it costs them the work and the
  // credits already spent on it.
  const canAbandon = !ended && (quiet || connection === "interrupted");
  // `of` without `index` never reaches here: the backend sends them together
  // or not at all, and a step nobody numbered shows no stage line.
  const stage = headlineStep(steps);
  const stageLine = !ended && stage?.index && stage?.of ? `Stage ${stage.index} of ${stage.of}` : null;
  return (
    // The height cap lives on the card, not on a scroller wrapped around it.
    // It used to be the other way round, which put the status line inside the
    // scrolling area: expanding the activity pushed the box past the cap, the
    // whole thing scrolled, and the line scrolled out of sight — taking the
    // only control that closes it again with it.
    <div className="nodrag nowheel flex min-h-0 max-h-[40%] shrink flex-col px-3 pb-2" aria-label="Run progress">
      <div className="flex min-h-0 flex-col rounded-lg border border-border bg-muted/30 text-xs">
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 px-3 py-2">
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
          {canAbandon && <button type="button" onClick={onStop} className="min-h-11 underline">Stop</button>}
        </div>
        {stageLine && <p className="shrink-0 px-3 pb-2 text-muted-foreground">{stageLine}</p>}
        {waiting && <p className="shrink-0 px-3 pb-2 text-muted-foreground">This step takes a few minutes. Nothing has gone wrong.</p>}
        {failed && !isStreaming && <p className="shrink-0 px-3 pb-2 text-muted-foreground">Review restores your text. Reattach files after a refresh.</p>}
        {execution?.committed_generation && (connection === "stopping" || state === "stopped") && <p className="shrink-0 px-3 pb-2 text-muted-foreground">A video already started may finish. No further clips will be ordered.</p>}
        {expanded && activity && (
          // Only what was opened scrolls. `nowheel` again because this is the
          // element the wheel now lands on, and on the task canvas a wheel that
          // reaches the board zooms it instead of scrolling this.
          <div className="chat-scrollbar nowheel min-h-0 flex-1 overflow-y-auto">
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
          </div>
        )}
      </div>
    </div>
  );
}
