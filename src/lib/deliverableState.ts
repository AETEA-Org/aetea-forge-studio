import type { ExecutionSnapshot } from "@/services/agentRun";
import type { CampaignTaskStatus } from "@/types/api";

/**
 * The one chip a deliverable shows, out of the two statuses it always has.
 *
 * A deliverable has a value on **both** axes at all times, and they are
 * independent: `tasks.status` is the durable record of where the work stands,
 * and a run's `ExecutionSnapshot.state` is whether a job is executing right
 * now. Conflating them is how "not started" and "in review" go missing from a
 * design — see `08-glossary-and-domain.md` → *Two kinds of status*.
 *
 * **A live run wins over task status**, because it is the more immediate truth:
 * a task left at `in_progress` whose run died reads *Stopped*, not *Working*.
 * That was the lesson of #107.
 */
export type DeliverableChip =
  | "failed" | "needs_go_ahead" | "working" | "stopping" | "queued"
  | "in_review" | "done" | "stopped" | "in_progress" | "not_started";

/** A run that has ended is history: the chip falls through to task status. */
const TERMINAL = new Set(["completed", "stopped", "failed"]);

export interface DeliverableState {
  chip: DeliverableChip;
  label: string;
  /** One line under the chip saying what is actually happening. */
  detail?: string;
  /** Whether this deliverable is occupying or waiting for a slot. */
  live: boolean;
}

const LABELS: Record<DeliverableChip, string> = {
  failed: "Failed",
  needs_go_ahead: "Needs go-ahead",
  working: "Working",
  stopping: "Stopping…",
  queued: "Queued",
  in_review: "In review",
  done: "Done",
  stopped: "Stopped",
  in_progress: "In progress",
  not_started: "Not started",
};

/** Tailwind classes per chip. Amber is "your turn", never a failure. */
export const CHIP_CLASSES: Record<DeliverableChip, string> = {
  failed: "bg-destructive/15 text-destructive",
  needs_go_ahead: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
  working: "bg-primary/20 text-primary",
  stopping: "bg-muted text-muted-foreground",
  queued: "bg-primary/10 text-primary/80",
  in_review: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
  done: "bg-green-500/20 text-green-600 dark:text-green-400",
  stopped: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/10 text-primary/80",
  not_started: "bg-muted text-muted-foreground",
};

/** Why a run is not advancing, in words rather than in reason codes. */
const REASONS: Record<string, string> = {
  deliverable_slot: "Starts when a slot frees up",
  render_slot: "Waiting for a render slot",
  approval: "Waiting on your go-ahead",
  video: "Waiting on the video supplier",
  queued: "Queued",
  interrupted: "The server restarted while this was running",
  stalled: "It stopped responding and was ended",
};

/**
 * What a run is doing, in one line.
 *
 * The newest named step first, because "Rendering segment 2 of 4" is worth more
 * than any sentence written here. A reason code is the fallback.
 */
function detailFor(execution: ExecutionSnapshot | undefined): string | undefined {
  const step = execution?.active_steps?.[execution.active_steps.length - 1];
  if (step?.label) return step.label;
  const reason = execution?.reason ?? "";
  return REASONS[reason];
}

/**
 * Resolve the chip, first match wins.
 *
 * One deliberate correction to the order as planned: `waiting` does **not** on
 * its own mean "needs go-ahead". It is any bounded dependency wait, and the
 * commonest one by far is polling the video supplier — so keying the go-ahead
 * chip on the state alone would have put "Needs go-ahead" on every render and
 * asked the user to act when there was nothing to do. The go-ahead chip is
 * keyed on there actually being a decision outstanding; every other wait reads
 * as working, which is what it is.
 */
export function deliverableState(
  status: CampaignTaskStatus,
  execution?: ExecutionSnapshot
): DeliverableState {
  const state = execution?.state;
  const liveRun = execution && state && !TERMINAL.has(state) ? execution : undefined;
  const chip = ((): DeliverableChip => {
    if (state === "failed") return "failed";
    if (liveRun?.pending_decision) return "needs_go_ahead";
    if (state === "working" || state === "retrying" || state === "waiting") return "working";
    if (state === "stopping") return "stopping";
    if (state === "queued") return "queued";
    // No live run past this point: the durable status is the truth.
    if (status === "under_review") return "in_review";
    if (status === "done") return "done";
    // A run of this deliverable's own that ended without finishing. #107's
    // lesson applies here and only here: the dead run is more informative
    // than the status it left behind.
    if (state === "stopped") return "stopped";
    // `in_progress` with no run of its own is reported as it stands, not as
    // *Stopped*, for two reasons. The backend already sweeps `in_progress`
    // back to `todo` when a run ends abnormally, so a stale claim is not the
    // likely explanation. And the campaign copilot works on a selected
    // deliverable under the **conversation** scope, so a deliverable can be
    // genuinely in hand with no run under its own id — calling that "Stopped"
    // would raise a false alarm about work that is happening.
    if (status === "in_progress") return "in_progress";
    return "not_started";
  })();
  return {
    chip,
    label: LABELS[chip],
    // A failure's own reason, which a terminal snapshot still carries.
    detail: chip === "failed" ? detailFor(execution) : detailFor(liveRun),
    live: chip === "working" || chip === "queued" || chip === "stopping"
      || chip === "needs_go_ahead",
  };
}

/**
 * What the person can do about it, and what to call it.
 *
 * **Only the controls the card is not already.** There used to be a second
 * control for opening — *Start*, *Open*, *Review*, *Resume*, *Open to retry*,
 * *Give go-ahead* — and every one of them was a link to the deliverable's
 * canvas, which is the address the whole card already links to. Each label also
 * repeated the chip immediately above it: "Not started / Start", "In review /
 * Review", "Stopped / Resume". So the card is the way in, the chip says where
 * the work stands, and neither needs a button to say it a second time.
 *
 * *Stop* stays because it is the one control that does something the card
 * cannot do, and the only one that is not a link.
 */
export interface DeliverableControls {
  /** Ends the run. Nothing already produced is lost. */
  stop?: string;
}

export function controlsFor(state: DeliverableState): DeliverableControls {
  switch (state.chip) {
    case "working":
    case "needs_go_ahead":
      return { stop: "Stop" };
    case "queued":
      // Cancelling something that has not started is a different promise from
      // stopping something mid-flight: nothing has been bought yet.
      return { stop: "Cancel" };
    default:
      return {};
  }
}
