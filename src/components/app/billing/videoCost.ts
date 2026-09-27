/**
 * What a video render will cost, before it is submitted.
 *
 * This is the one place the UI predicts a charge, and it is allowed to because
 * video is **deterministic**: a second of 1080p costs the same every time, so
 * the figure is a price rather than a guess. Everything else the customer does
 * is charged from measured cost and must never be predicted here.
 *
 * It matters more than the other estimates because a submitted render cannot be
 * recalled — Kling bills for the job once it starts, so "are you sure" has to
 * come before the request, not after.
 *
 * Rates come from `aetea-docs/09-billing-and-credits.md` and are derived, not
 * typed — see `creditsFor`.
 */
import { creditsFor } from "@/components/landing/pricing/pricingData";

/** Provider cost per second of finished video. */
const COST_PER_SECOND: Record<string, number> = {
  "720p": 0.084,
  "1080p": 0.112,
  "4k": 0.42,
};

/** Adding sound moves 720p and 1080p up a band. 4K is already the top rate. */
const WITH_AUDIO_COST_PER_SECOND: Record<string, number> = {
  "720p": 0.112,
  "1080p": 0.14,
  "4k": 0.42,
};

export const DEFAULT_VIDEO_RESOLUTION = "720p";
export const DEFAULT_VIDEO_SECONDS = 5;

export function videoCreditsFor(options: {
  resolution?: string;
  seconds?: number;
  withAudio?: boolean;
}): number {
  const resolution = (options.resolution || DEFAULT_VIDEO_RESOLUTION).toLowerCase();
  const seconds = options.seconds || DEFAULT_VIDEO_SECONDS;
  // Undefined means audio, because that is what the product does: the toggle
  // reads `audio === false` and `kling_omni.py` has `audio: bool = True`. A
  // caller that forgets this flag then over-quotes rather than under-quotes,
  // and on a charge that cannot be recalled that is the only safe direction to
  // be wrong in.
  const withAudio = options.withAudio !== false;
  const table = withAudio ? WITH_AUDIO_COST_PER_SECOND : COST_PER_SECOND;
  const perSecond = table[resolution] ?? table[DEFAULT_VIDEO_RESOLUTION];
  return creditsFor(perSecond) * seconds;
}
