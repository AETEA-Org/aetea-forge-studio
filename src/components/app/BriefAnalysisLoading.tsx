import { Sparkles } from "lucide-react";
import { AgentSteps } from "@/components/app/AgentSteps";
import type { ProgressStep } from "@/services/agentRun";

interface BriefAnalysisLoadingProps {
  /** Steps the agent has reported so far, in order. */
  steps: ProgressStep[];
}

/**
 * Shown while a campaign is being built.
 *
 * There is no percentage. An earlier version mapped the pipeline's step names
 * to fixed percentages, which meant the bar guessed how far along it was — and
 * silently froze the moment those names changed. Named steps cannot drift out
 * of sync with the work, and cannot move backwards.
 */
export function BriefAnalysisLoading({ steps }: BriefAnalysisLoadingProps) {
  const current = steps.filter((s) => s.state === "started").at(-1);
  const done = steps.filter((s) => s.state === "done").length;

  return (
    <div className="min-h-full flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-primary/20 bg-primary/10 backdrop-blur-sm">
              <Sparkles className="h-12 w-12 animate-pulse text-primary" />
            </div>
          </div>
        </div>

        <h2 className="mb-3 text-center text-2xl font-bold">
          Building your campaign
        </h2>
        <p className="mb-8 min-h-[1.75rem] animate-pulse text-center text-lg text-primary">
          {current?.label ?? "Getting started..."}
        </p>

        {steps.length > 0 ? (
          <div className="mb-6">
            <AgentSteps steps={steps} />
          </div>
        ) : (
          <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/3 animate-shimmer rounded-full bg-primary" />
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {done > 0
            ? `${done} of ${steps.length} steps done. This takes a few moments.`
            : "This takes a few moments while the brief is read and the campaign is put together."}
        </p>
      </div>
    </div>
  );
}
