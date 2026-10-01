import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Loader2, X } from "lucide-react";
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
  const [open, setOpen] = useState(false);
  if (steps.length === 0) return null;
  const current = [...steps].reverse().find((step) => step.state === "started") ?? steps[steps.length - 1];

  return (
    <div className="rounded-lg border border-border/60 bg-muted/30">
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}
        className="flex min-h-9 w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
        {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
        <span className="shrink-0">Checklist</span>
        <span className="truncate">{current.label}</span>
      </button>
      {open && <ul className="chat-scrollbar max-h-40 overflow-y-auto space-y-1.5 px-3 pb-3">
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
    </ul>}
    </div>
  );
}
