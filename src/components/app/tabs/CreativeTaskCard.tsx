import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Check, ChevronRight, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { cancelRun } from "@/services/agentRun";
import type { ExecutionSnapshot } from "@/services/agentRun";
import { controlsFor, deliverableState } from "@/lib/deliverableState";
import type { CampaignTask, CampaignTaskStatus } from "@/types/api";

interface CreativeTaskCardProps {
  task: CampaignTask;
  chatId: string;
  /** The work needed to produce this deliverable, in order. */
  subTasks?: CampaignTask[];
  /** This deliverable's own run, when one is going. */
  execution?: ExecutionSnapshot;
}

/** Where one piece of work has got to, at a glance. */
function SubTaskIcon({ status }: { status: CampaignTaskStatus }) {
  if (status === 'done') return <Check className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />;
  if (status === 'in_progress') return <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary motion-reduce:animate-none" />;
  if (status === 'under_review') return <Circle className="h-3.5 w-3.5 shrink-0 fill-current text-amber-600 dark:text-amber-400" />;
  return <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />;
}

/** Expand the row for details; the separate arrow always opens the canvas. */
export function CreativeTaskCard({ task, chatId, subTasks = [], execution }: CreativeTaskCardProps) {
  const state = deliverableState(task.status, execution);
  const controlSet = controlsFor(state);
  const categoryLabel = task.category?.replace(/_/g, " ") || "task";
  const done = subTasks.filter((child) => child.status === 'done').length;
  const [stopping, setStopping] = useState(false);
  const [stopError, setStopError] = useState(false);
  const canvasAction = controlSet.open && controlSet.open !== "Start"
    ? `${controlSet.open}: ${task.title}`
    : `Open canvas for ${task.title}`;

  return (
    <div className="relative min-w-0 border-b border-border">
      <details className="group">
        <summary className="flex min-h-[72px] cursor-pointer list-none items-start gap-3 py-4 pl-1 pr-12 hover:bg-muted/20 [&::-webkit-details-marker]:hidden focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
          <ChevronRight
            aria-hidden
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90 motion-reduce:transition-none"
          />
          <div className="min-w-0 flex-1">
            <span className="block break-words font-medium text-sm">{task.title}</span>
            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className="capitalize">{categoryLabel}</span>
              {subTasks.length > 0 && <span>· {done}/{subTasks.length} done</span>}
            </div>
            <span className={cn(
              "mt-1.5 inline-flex items-center gap-1.5 text-xs",
              state.chip === "working" || state.chip === "queued" || state.chip === "in_progress"
                ? "text-primary"
                : state.chip === "needs_go_ahead" || state.chip === "in_review"
                  ? "text-amber-600 dark:text-amber-400"
                  : state.chip === "done"
                    ? "text-green-600 dark:text-green-400"
                    : state.chip === "failed"
                      ? "text-red-600 dark:text-red-400"
                      : "text-muted-foreground"
            )}>
              {state.chip === "working" && (
                <Loader2 aria-hidden className="h-3 w-3 animate-spin motion-reduce:animate-none" />
              )}
              {state.label}
            </span>
          </div>
        </summary>
        <div className="pb-5 pl-8 pr-3 text-sm text-muted-foreground">
          {task.description && <p className="mb-3 whitespace-pre-wrap break-words">{task.description}</p>}
          {task.deadline && <p className="mb-3">Deadline: {task.deadline}</p>}
          {state.detail && <p className="mb-3 break-words" role="status">{state.detail}</p>}
          {!task.description && !task.deadline && !state.detail && subTasks.length === 0 && (
            <p>Open the canvas to view or work on this deliverable.</p>
          )}
          {subTasks.length > 0 && (
            <ul>
              {subTasks.map((child) => (
                <li key={child.id} className="flex items-start gap-2 border-t border-border py-2 text-sm">
                  <span className="mt-0.5"><SubTaskIcon status={child.status} /></span>
                  <div className="min-w-0 flex-1">
                    <span className={cn("break-words", child.status !== 'done' && "text-foreground")}>{child.title}</span>
                    {child.category && <span className="mt-0.5 block text-xs capitalize">{child.category.replace(/_/g, " ")}</span>}
                  </div>
                  <span className="shrink-0 text-xs">{
                    child.status === 'done' ? 'Done' : child.status === 'in_progress' ? 'In progress'
                      : child.status === 'under_review' ? 'In review' : 'Not started'
                  }</span>
                </li>
              ))}
            </ul>
          )}
          {controlSet.stop && (
            <button
              type="button"
              disabled={stopping}
              onClick={() => {
                setStopping(true);
                setStopError(false);
                // Keep the chip driven by the server, even when cancellation fails.
                cancelRun(chatId, task.id)
                  .catch(() => setStopError(true))
                  .finally(() => setStopping(false));
              }}
              className="mt-3 min-h-11 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted hover:text-foreground disabled:opacity-60"
            >
              {stopping ? "Stopping…" : controlSet.stop}
            </button>
          )}
          {stopError && <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">Couldn’t {controlSet.stop?.toLowerCase() || "stop"} this deliverable. Try again.</p>}
        </div>
      </details>
      <Link
        to={`/app/chat/${chatId}/task/${task.id}`}
        aria-label={canvasAction}
        title={canvasAction}
        className="absolute right-0 top-3 flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowUpRight aria-hidden className="h-5 w-5" />
      </Link>
    </div>
  );
}
