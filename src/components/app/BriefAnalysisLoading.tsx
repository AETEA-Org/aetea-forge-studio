import { AgentDecision } from "./AgentDecision";
import { AgentProgress } from "./AgentProgress";
import { cancelRun } from "@/services/agentRun";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AgentSteps } from "@/components/app/AgentSteps";
import { stepIcon } from "@/components/app/stepIcons";
import { cn } from "@/lib/utils";
import type { ProgressStep } from "@/services/agentRun";

interface BriefAnalysisLoadingProps {
  /** Steps the agent has reported so far, in order. */
  steps: ProgressStep[];
  chatId?: string;
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
 * One dot per reported step: filled behind the current one, hollow ahead of
 * it. It counts steps that actually arrived rather than predicting a total, so
 * it grows as the run does and can never run backwards. Decoration — the label
 * beside it carries the meaning, and this is hidden from screen readers.
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
  const current = steps.filter((s) => s.state === "started").at(-1);
  const done = steps.filter((s) => s.state === "done").length;
  const currentAt = current ? steps.findIndex((s) => s.step_id === current.step_id) : done;
  const StepIcon = stepIcon(current?.step_id ?? "");
  const inline = variant === "inline";

  if (inline) {
    return (
      <div
        role="status"
        className="mx-4 mb-2 flex shrink-0 items-center gap-3 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5"
      >
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
          <StepIcon
            key={current?.step_id ?? "idle"}
            className="h-5 w-5 animate-in fade-in zoom-in-50 text-primary duration-300 motion-reduce:animate-none"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Building your campaign</p>
          <p className="truncate text-xs text-primary">
            {current?.label ?? "Getting started…"}
          </p>
        </div>
        {steps.length > 1 && (
          <span aria-hidden className="shrink-0 text-xs text-muted-foreground">
            {done}/{steps.length}
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
              <StepIcon
                key={current?.step_id ?? "idle"}
                className="h-12 w-12 animate-in fade-in zoom-in-50 text-primary duration-300 motion-reduce:animate-none"
              />
            </div>
          </div>
        </div>

        <h2 className="mb-3 text-center text-2xl font-bold">
          Building your campaign
        </h2>
        <p className="mb-5 min-h-[1.75rem] text-center text-lg text-primary">
          {current?.label ?? "Getting started..."}
        </p>

        <StepDots steps={steps} at={currentAt} />

        {steps.length > 0 ? (
          <div className="mb-6">
            <AgentSteps steps={steps} />
          </div>
        ) : (
          <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/3 animate-shimmer rounded-full bg-primary" />
          </div>
        )}

        {chatId && <div className="mb-4">
          <AgentProgress chatId={chatId} isStreaming connection={stopping ? "stopping" : "connected"} thinkingText="" steps={[]} />
          <AgentDecision chatId={chatId} />
          <div className="flex justify-center gap-2">
            <Button variant="outline" className="min-h-11" onClick={onOpenConversation}>Open conversation</Button>
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
          {done > 0
            ? `${done} of ${steps.length} steps done. This takes a few moments.`
            : "This takes a few moments while the brief is read and the campaign is put together."}
        </p>
      </div>
    </div>
  );
}
