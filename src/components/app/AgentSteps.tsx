import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProgressStep } from "@/services/agentRun";

interface AgentStepsProps {
  steps: ProgressStep[];
}

/**
 * What the agent is doing, as a list of named steps.
 *
 * Replaces the percentage bar, which had to guess how far along it was and
 * could jump backwards when it guessed wrong. A step either has not started,
 * is running, or is finished — so the list only ever moves forward.
 */
export function AgentSteps({ steps }: AgentStepsProps) {
  if (steps.length === 0) return null;

  return (
    <ul className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
      {steps.map((step) => (
        <li
          key={step.step_id}
          className={cn(
            "flex items-center gap-2 text-xs",
            step.state === "done" ? "text-muted-foreground" : "text-foreground"
          )}
        >
          {step.state === "started" && (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
          )}
          {step.state === "done" && (
            <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
          )}
          {step.state === "failed" && (
            <X className="h-3.5 w-3.5 shrink-0 text-destructive" />
          )}
          <span className={cn(step.state === "done" && "line-through/0")}>
            {step.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
