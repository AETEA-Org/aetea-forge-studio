import { AgentDecision } from "./AgentDecision";
import { AgentProgress } from "./AgentProgress";
import { cancelRun } from "@/services/agentRun";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AgentSteps } from "@/components/app/AgentSteps";
import { stepIcon } from "@/components/app/stepIcons";
import { buildProgress } from "@/lib/buildProgress";
import { cn } from "@/lib/utils";
import type { ProgressStep } from "@/services/agentRun";

interface BriefAnalysisLoadingProps {
  /** Steps the agent has reported so far, in order. */
  steps: ProgressStep[];
  chatId?: string;
  /** Where to go after stopping the build. Not a way out of a running one. */
  onOpenConversation?: () => void;
  /**
   * "page" owns the whole view, on the way in from a new brief. "inline" sits
   * in a conversation that is already on screen, where the thread, the stop
   * control and the decision card are the caller's and must not be repeated.
   */
  variant?: "page" | "inline";
}

/**
 * How far along the build is, as a row of dots.
 *
 * One dot per *stage* — not per step. Counting steps meant a build that
 * searched the web eight times still showed barely any dots, because every one
 * of those searches was the same step id; the row stayed still while the
 * headline flickered, so it did nothing to contradict it. Stages arrive once
 * each and in order, which is what makes them countable.
 *
 * It still counts what arrived rather than predicting a total, so it grows as
 * the build does and can never run backwards. Decoration — the label beside it
 * carries the meaning, and this is hidden from screen readers.
 */
function StepDots({ steps, at }: { steps: ProgressStep[]; at: number }) {
  if (steps.length < 2) return null;
  return (
    <div aria-hidden className="mb-5 flex items-center justify-center gap-1.5">
      {steps.map((step, index) => (
        <span
          key={step.step_id}
          className={cn(
            "h-1.5 w-1.5 rounded-full transition-all motion-reduce:transition-none",
            index < at && "bg-primary/50",
            index === at && "scale-150 bg-primary",
            index > at && "bg-border"
          )}
        />
      ))}
    </div>
  );
}

/**
 * Shown while a campaign is being built.
 *
 * There is no percentage. An earlier version mapped the pipeline's step names
 * to fixed percentages, which meant the bar guessed how far along it was — and
 * silently froze the moment those names changed. Named steps cannot drift out
 * of sync with the work, and cannot move backwards.
 *
 * The icon follows the step. That is keyed on `step_id`, which the backend
 * owns, so it reports the stage the run is actually in rather than a guess at
 * how much is left — the thing the percentage got wrong. The label is always
 * rendered beside it, so the icon is never the only signal.
 */
export function BriefAnalysisLoading({
  steps,
  chatId,
  onOpenConversation,
  variant = "page",
}: BriefAnalysisLoadingProps) {
  const [stopping, setStopping] = useState(false);
  const [stopError, setStopError] = useState<string | null>(null);
  // The stage leads and never goes backwards; the tool is a quiet aside. See
  // `buildProgress` for why showing "whatever is running" looked like the
  // build was going round in circles.
  const { stage, stages, stageIndex, activity } = buildProgress(steps);
  const done = stages.filter((s) => s.state === "done").length;
  const StepIcon = stepIcon(stage?.step_id ?? "");
  const inline = variant === "inline";

  if (inline) {
    return (
      <div
        role="status"
        className="mx-4 mb-2 flex shrink-0 items-center gap-3 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5"
      >
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
          {/* Keyed on the stage, so the icon animates once per part of the
              campaign rather than on every tool call. */}
          <StepIcon
            key={stage?.step_id ?? "idle"}
            className="h-5 w-5 animate-in fade-in zoom-in-50 text-primary duration-300 motion-reduce:animate-none"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {stage?.label ?? "Building your campaign"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {activity?.label ?? "Building your campaign"}
          </p>
        </div>
        {/* The banner keeps a denominator where the full screen drops one.
            The growing total is the same mild untruth in both, but here it is
            the only indication of movement — there is no room for dots — and
            "2" on its own says nothing. A slightly soft total beats no signal.
            It is aria-hidden either way; the two lines carry the meaning. */}
        {stages.length > 1 && (
          <span aria-hidden className="shrink-0 text-xs text-muted-foreground">
            {done}/{stages.length}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-full flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse motion-reduce:animate-none" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-primary/20 bg-primary/10 backdrop-blur-sm">
              {/* Keyed on the stage. It used to be keyed on whatever step was
                  running, which meant it remounted and replayed this animation
                  every time a tool started or finished — and reset to the
                  generic icon in between, which is most of the time. */}
              <StepIcon
                key={stage?.step_id ?? "idle"}
                className="h-12 w-12 animate-in fade-in zoom-in-50 text-primary duration-300 motion-reduce:animate-none"
              />
            </div>
          </div>
        </div>

        <h2 className="mb-3 text-center text-2xl font-bold">
          Building your campaign
        </h2>
        {/* The stage. A live region, like the inline variant already had:
            without it a screen reader gets the first stage and silence
            thereafter, and this is the variant on the way in from a new
            brief. */}
        <p role="status" className="min-h-[1.75rem] text-center text-lg text-primary">
          {stage?.label ?? "Getting started..."}
        </p>
        {/* The tool, if one is running. Deliberately quiet, and deliberately
            allowed to be empty: the height is reserved so the layout does not
            jump as it comes and goes, and the stage above it does not move
            when it does. Not a live region — announcing every web search over
            the stage would bury the thing that matters. */}
        <p aria-hidden className="mb-5 min-h-[1.25rem] text-center text-sm text-muted-foreground">
          {activity?.label ?? ""}
        </p>

        <StepDots steps={stages} at={stageIndex} />

        {stages.length > 0 ? (
          <div className="mb-6">
            {/* Stages only. Fed every step, this listed the same web search
                eight times over and read as noise rather than progress. */}
            <AgentSteps steps={stages} />
          </div>
        ) : (
          <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/3 animate-shimmer rounded-full bg-primary" />
          </div>
        )}

        {chatId && <div className="mb-4">
          <AgentProgress chatId={chatId} isStreaming connection={stopping ? "stopping" : "connected"} thinkingText="" steps={[]} />
          <AgentDecision chatId={chatId} />
          {/* Stop is the only way off this screen, and that is the point.
              There used to be an "Open conversation" button beside it, which
              invited people to leave a build they had just asked for and then
              watch it from somewhere else. Leaving is not needed: the screen
              dismisses itself and routes to the campaign the moment the build
              completes, and every failure path clears it and reports back on
              the form. Anything needing a decision mid-build is answered right
              here, by the card above. */}
          <div className="flex justify-center">
            <Button variant="ghost" className="min-h-11" disabled={stopping} onClick={async () => {
              if (stopping) return;
              setStopping(true); setStopError(null);
              try { await cancelRun(chatId); onOpenConversation?.(); }
              catch (err) { setStopError(err instanceof Error ? err.message : "Could not stop. Try again."); }
              finally { setStopping(false); }
            }}>{stopping ? "Stopping…" : "Stop"}</Button>
          </div>
          {stopError && <p role="alert" className="text-xs text-destructive">{stopError}</p>}
        </div>}
        <p className="text-center text-sm text-muted-foreground">
          {/* Deliberately no total. Stages are counted as they arrive, so a
              denominator grows during the build — "2 of 3" becoming "2 of 4"
              reads as the finish line moving away, which is the same
              complaint in a quieter form. The dots carry the sense of
              progress without ever claiming to know how many there are. */}
          {done > 0
            ? `${done} ${done === 1 ? "part" : "parts"} done. This takes a few moments.`
            : "This takes a few moments while the brief is read and the campaign is put together."}
        </p>
      </div>
    </div>
  );
}
