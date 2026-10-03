import type { ProgressStep } from "@/services/agentRun";

/**
 * Two different things arrive on one stream, and the build screen needs them
 * apart.
 *
 * The backend reports a *step* whenever a tool starts and again when it ends.
 * Some of those steps name a part of the campaign — setting it up, writing the
 * brief, the research, the strategy, the creative direction, planning the
 * work. The rest name a tool the agent reached for along the way: a web
 * search, a page read, an image.
 *
 * Treating them as one sequence is what made the screen look like it was going
 * round in circles, and the cause is worth stating because it is not obvious:
 *
 * - **Most of the time, no step is running at all.** Between tool calls the
 *   agent is writing, which can take far longer than the calls themselves and
 *   announces nothing. A screen that shows "whatever is running right now"
 *   therefore spends much of the build showing nothing, and falls back to
 *   something like "Getting started" — long after it started.
 * - **Tool step ids repeat.** Every web search is the step `search`. A build
 *   that searches eight times cycles that one id started→done→started→done, so
 *   the same label appears, vanishes and reappears rather than progressing.
 *
 * So: the stage is what the screen leads with, and it only ever moves forward.
 * The tool is secondary and is allowed to come and go, because a small line
 * going quiet reads as calm where a headline going blank reads as broken.
 */

/** Step ids that name a part of the campaign rather than a tool call. */
const STAGE_IDS = new Set(["campaign", "creative", "tasks"]);

/** `section-brief`, `section-research`, `section-strategy`, and any later one. */
const STAGE_PREFIX = "section-";

export function isStageStep(stepId: string): boolean {
  return STAGE_IDS.has(stepId) || stepId.startsWith(STAGE_PREFIX);
}

export interface BuildProgress {
  /** The part of the campaign being built. Never moves backwards. */
  stage?: ProgressStep;
  /** Every stage seen so far, in the order they began. */
  stages: ProgressStep[];
  /** Where `stage` sits in `stages`. */
  stageIndex: number;
  /** The tool running right now, if any. Absent between calls, by design. */
  activity?: ProgressStep;
}

/**
 * Split the stream into the stage to lead with and the tool to mention.
 *
 * **Monotonic for free.** `steps` is append-on-first-sight and update-in-place,
 * so its order is the order things first began and never changes. The last
 * stage in it is therefore the furthest the build has reached, whatever has
 * finished since — which is what keeps the headline from flickering back to an
 * earlier stage when a later one briefly has nothing running.
 *
 * Anything unrecognised counts as a tool, not a stage. If a new stage is added
 * to the backend and not listed here it shows up in the quiet line instead of
 * the headline: wrong, but harmless, and visibly so.
 */
export function buildProgress(steps: ProgressStep[]): BuildProgress {
  const stages = steps.filter((step) => isStageStep(step.step_id));
  const stage = stages.at(-1);
  const activity = steps
    .filter((step) => !isStageStep(step.step_id) && step.state === "started")
    .at(-1);
  return {
    stage,
    stages,
    stageIndex: stage ? stages.length - 1 : 0,
    activity,
  };
}
