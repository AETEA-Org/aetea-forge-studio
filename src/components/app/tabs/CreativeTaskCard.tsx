import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronRight, Circle, FileText, Image, Loader2, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { cancelRun } from "@/services/agentRun";
import type { ExecutionSnapshot } from "@/services/agentRun";
import { CHIP_CLASSES, controlsFor, deliverableState } from "@/lib/deliverableState";
import type { CampaignTask, CampaignTaskStatus } from "@/types/api";

interface CreativeTaskCardProps {
  task: CampaignTask;
  chatId: string;
  /** The work needed to produce this deliverable, in order. */
  subTasks?: CampaignTask[];
  /** This deliverable's own run, when one is going. */
  execution?: ExecutionSnapshot;
}

function CategoryIcon({ category }: { category: string | null }) {
  const cat = (category || "").toLowerCase();
  if (cat.includes("image")) {
    return <Image className="h-4 w-4 shrink-0" />;
  }
  if (cat.includes("video")) {
    return <Video className="h-4 w-4 shrink-0" />;
  }
  return <FileText className="h-4 w-4 shrink-0" />;
}

/** Where one piece of work has got to, at a glance. */
function SubTaskIcon({ status }: { status: CampaignTaskStatus }) {
  if (status === 'done') return <Check className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />;
  if (status === 'in_progress') return <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary motion-reduce:animate-none" />;
  if (status === 'under_review') return <Circle className="h-3.5 w-3.5 shrink-0 fill-current text-amber-600 dark:text-amber-400" />;
  return <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />;
}

/**
 * One deliverable, with the work needed to produce it folded inside.
 *
 * A `<details>` rather than a toggle of our own: expanding, keyboard access and
 * what a screen reader announces all come from the element. The title stays a
 * link, so opening the canvas and opening the list are different gestures
 * rather than the same click guessing which was meant.
 *
 * Clicking that link does not also expand the card, even though it sits inside
 * the `<summary>`: react-router's `Link` calls `preventDefault` to navigate on
 * the client, and that cancels the summary's toggle along with it. Worth
 * knowing before anyone swaps the `Link` for a plain anchor or a handler that
 * does not prevent the default — the card would start opening on every
 * navigation.
 *
 * With no children it renders as the card it always was, which is what every
 * campaign saved before nesting existed still looks like.
 */
export function CreativeTaskCard({ task, chatId, subTasks = [], execution }: CreativeTaskCardProps) {
  const state = deliverableState(task.status, execution);
  const controlSet = controlsFor(state);
  const categoryLabel = task.category?.replace(/_/g, " ") || "task";
  const done = subTasks.filter((child) => child.status === 'done').length;
  const [stopping, setStopping] = useState(false);

  /**
   * Controls are rendered inline, never revealed on hover.
   *
   * This grid goes down to one column on a phone and the same cards appear at
   * 320px on a canvas node, where no hover exists at all — a control that only
   * appears on hover is a control half the users never find.
   */
  const controls = !controlSet.open && !controlSet.stop ? null : (
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
            // Scoped to this deliverable, so the rest keep running. The chip
            // follows from the next poll rather than from an optimistic
            // guess — saying "Stopped" before the server agrees is how a
            // stop that failed looks like one that worked.
            cancelRun(chatId, task.id)
              .catch(() => { /* The chip stays as it is; nothing was lost. */ })
              .finally(() => setStopping(false));
          }}
          className="min-h-8 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-60"
        >
          {stopping ? "Stopping…" : controlSet.stop}
        </button>
      )}
    </div>
  );

  /**
   * `linkTitle` is false when something above this is already the link to the
   * canvas. Two nested links are invalid HTML and hand a screen reader two
   * actions for one thing. The expandable card still needs the title to be
   * the link, because its outer element is a `<summary>` that toggles.
   */
  const head = (linkTitle: boolean) => (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="mb-3 flex items-start gap-3">
        <div className="shrink-0 text-muted-foreground">
          <CategoryIcon category={task.category} />
        </div>
        {linkTitle ? (
          <Link
            to={`/app/chat/${chatId}/task/${task.id}`}
            className="min-h-0 break-words font-medium text-foreground line-clamp-3 hover:underline"
            title={task.title}
          >
            {task.title}
          </Link>
        ) : (
          <span
            className="min-h-0 break-words font-medium text-foreground line-clamp-3"
            title={task.title}
          >
            {task.title}
          </span>
        )}
      </div>
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
        {subTasks.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {done}/{subTasks.length} done
          </span>
        )}
      </div>
      {state.detail && (
        <p className="mt-1.5 text-xs text-muted-foreground">{state.detail}</p>
      )}
    </div>
  );

  if (subTasks.length === 0) {
    // The whole card opens the canvas, as it always did. It briefly stopped
    // being a link when the expandable version was added, while keeping the
    // hover highlight — so it advertised an affordance it no longer had, and
    // a finished deliverable has no controls, leaving the title its only way
    // in. The controls sit outside the link: nesting a button inside an
    // anchor is invalid HTML and gives a screen reader two conflicting
    // actions for one element.
    return (
      <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50">
        <Link
          to={`/app/chat/${chatId}/task/${task.id}`}
          className="flex min-w-0 flex-1 flex-col rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {head(false)}
        </Link>
        {controls}
      </div>
    );
  }

  return (
    <details className="group h-full min-w-0 overflow-hidden rounded-lg border border-border bg-card transition-colors open:bg-card hover:bg-muted/50 open:hover:bg-card">
      <summary className="flex cursor-pointer list-none items-start gap-2 p-4 [&::-webkit-details-marker]:hidden focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
        <ChevronRight
          aria-hidden
          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90 motion-reduce:transition-none"
        />
        <div className="min-w-0 flex-1">
          {head(true)}
          {/* Inside the summary, so the controls are reachable without
              expanding — but the button's own click must not toggle the card
              as well, which is what `stopPropagation` is for. The `Link`
              needs no such help: react-router already prevents the default. */}
          <div
            role="presentation"
            onClick={(event) => event.stopPropagation()}
          >
            {controls}
          </div>
        </div>
      </summary>
      <ul className="border-t border-border bg-muted/20 px-4 py-2">
        {subTasks.map((child) => (
          <li
            key={child.id}
            className="flex items-center gap-2 border-b border-border/50 py-2 text-sm last:border-b-0"
          >
            <SubTaskIcon status={child.status} />
            <span
              className={cn(
                "min-w-0 flex-1 break-words",
                child.status === 'done' && "text-muted-foreground"
              )}
            >
              {child.title}
            </span>
            <span className="shrink-0 text-xs capitalize text-muted-foreground">
              {child.category?.replace(/_/g, " ") || ""}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
