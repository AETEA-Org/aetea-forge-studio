import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildProgress } from "@/lib/buildProgress";
import type { ProgressStep } from "@/services/agentRun";

interface AgentStepsProps {
  steps: ProgressStep[];
}

/**
 * What the agent has done so far, listed inside the open progress panel.
 *
 * It used to be a collapsible of its own, titled "Checklist", nested inside a
 * "Show activity" toggle that was itself inside the status card. Three boxes
 * and two clicks to read one line. The panel owns the toggle now, so this is
 * a plain list.
 *
 * **Stages are the backbone; tool calls hang off the current one.** Listing
 * every step flat is what produced a wall in which a web search appeared,
 * vanished and reappeared — see `lib/buildProgress.ts`. Finished tool calls
 * are not history worth keeping on screen: what happened is the stages, and
 * what is happening is the one tool running now.
 */
export function AgentSteps({ steps }: AgentStepsProps) {
  const { stages, activity } = buildProgress(steps);
  const shown = stages.length > 0 ? stages : steps;
  if (shown.length === 0) return null;

  return (
    <ul className="chat-scrollbar max-h-48 space-y-1.5 overflow-y-auto">
      {shown.map((step) => (
        <li key={step.step_id} className="flex items-start gap-2 text-xs">
          <Mark state={step.state} />
          <span className={cn(step.state === "done" ? "text-muted-foreground" : "text-foreground")}>
            {step.label}
          </span>
        </li>
      ))}
      {/* Indented under the stage it belongs to, and only while it runs. */}
      {stages.length > 0 && activity && (
        <li className="flex items-start gap-2 pl-[22px] text-xs text-muted-foreground">
          {activity.label}
        </li>
      )}
    </ul>
  );
}

function Mark({ state }: { state: ProgressStep["state"] }) {
  if (state === "started") {
    return <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-primary" />;
  }
  if (state === "failed") {
    return <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />;
  }
  return <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />;
}
