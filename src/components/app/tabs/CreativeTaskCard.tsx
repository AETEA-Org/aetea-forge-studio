import { useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Image, Loader2, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/ui/markdown";
import { cancelRun } from "@/services/agentRun";
import type { ExecutionSnapshot } from "@/services/agentRun";
import { CHIP_CLASSES, controlsFor, deliverableState } from "@/lib/deliverableState";
import type { CampaignTask } from "@/types/api";

interface CreativeTaskCardProps {
  task: CampaignTask;
  chatId: string;
  /** This deliverable's own run, when one is going. */
  execution?: ExecutionSnapshot;
}

function CategoryIcon({ category }: { category: string | null }) {
  const cat = (category || "").toLowerCase();
  if (cat.includes("image")) return <Image className="h-4 w-4 shrink-0" />;
  if (cat.includes("video")) return <Video className="h-4 w-4 shrink-0" />;
  return <FileText className="h-4 w-4 shrink-0" />;
}

/**
 * One deliverable: what will exist when the work is done, and the brief for it.
 *
 * **The description is the deliverable.** Nesting production steps underneath
 * each entry was built to answer a complaint nobody had made — Studio preferred
 * this card and said so. What was actually wrong was the description: it was
 * written as one unbroken paragraph and rendered as plain text, so a brief that
 * genuinely carried the territory, the format, the dimensions and the
 * completion criteria arrived as a wall nobody read. So the structure goes back
 * to one card per deliverable, and the description is rendered as the markdown
 * it is written in.
 *
 * It is capped rather than clamped to a line count: a brief is headings and
 * bullets, and `line-clamp` on that cuts mid-list with no sign anything is
 * missing. A fade says there is more, and the card opens the canvas for all of
 * it.
 *
 * The controls sit outside the link. A button nested inside an anchor is
 * invalid HTML and hands a screen reader two conflicting actions for one
 * element.
 */
export function CreativeTaskCard({ task, chatId, execution }: CreativeTaskCardProps) {
  const state = deliverableState(task.status, execution);
  const controlSet = controlsFor(state);
  const categoryLabel = task.category?.replace(/_/g, " ") || "task";
  const [stopping, setStopping] = useState(false);
  const [stopError, setStopError] = useState(false);

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50">
      <Link
        to={`/app/chat/${chatId}/task/${task.id}`}
        className="flex min-w-0 flex-1 flex-col rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <div className="mb-3 flex items-start gap-3">
          <div className="shrink-0 text-muted-foreground">
            <CategoryIcon category={task.category} />
          </div>
          <span
            className="min-h-0 break-words font-medium text-foreground line-clamp-3"
            title={task.title}
          >
            {task.title}
          </span>
        </div>

        {task.description && (
          <div className="relative mb-3 max-h-56 overflow-hidden">
            <Markdown className="text-xs leading-relaxed text-muted-foreground">
              {task.description}
            </Markdown>
            {/* Says there is more without pretending to know where the cut
                landed. `to-card` matches the card, and the hover state is
                translucent over it, so the fade does not show a seam. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-transparent to-card"
            />
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
              CHIP_CLASSES[state.chip]
            )}
          >
            {state.chip === "working" && (
              <Loader2 className="mr-1 h-3 w-3 animate-spin motion-reduce:animate-none" />
            )}
            {state.label}
          </span>
          <span className="text-xs capitalize text-muted-foreground">{categoryLabel}</span>
          {task.deadline && (
            <span className="text-xs text-muted-foreground">Due {task.deadline}</span>
          )}
        </div>
        {state.detail && (
          <p className="mt-1.5 text-xs text-muted-foreground" role="status">{state.detail}</p>
        )}
      </Link>

      {(controlSet.open || controlSet.stop) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {controlSet.open && (
            <Link
              to={`/app/chat/${chatId}/task/${task.id}`}
              className="inline-flex min-h-8 items-center rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
            >
              {controlSet.open}
            </Link>
          )}
          {controlSet.stop && (
            <button
              type="button"
              disabled={stopping}
              onClick={() => {
                setStopping(true);
                setStopError(false);
                // Scoped to this deliverable, so the rest keep running. The chip
                // follows from the next poll rather than from an optimistic
                // guess — saying "Stopped" before the server agrees is how a
                // stop that failed looks like one that worked.
                cancelRun(chatId, task.id)
                  .catch(() => setStopError(true))
                  .finally(() => setStopping(false));
              }}
              className="min-h-8 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-60"
            >
              {stopping ? "Stopping…" : controlSet.stop}
            </button>
          )}
        </div>
      )}
      {stopError && (
        <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">
          Couldn’t {controlSet.stop?.toLowerCase() || "stop"} this deliverable. Try again.
        </p>
      )}
    </div>
  );
}
