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
 * **The figures are the published prices, read from one place.** Until
 * 2026-10-28 this file derived them from provider cost with `creditsFor()`,
 * which was right while the meter did the same. The meter now charges the
 * published figure instead, so deriving here quoted a different number from the
 * one the customer was billed — and in the two bands that are the default it
 * quoted *less*: 43 a second against 45 for 720p with sound, 54 against 60 for
 * 1080p with sound. Under-quoting a charge that cannot be recalled is the one
 * direction this file must never be wrong in, which its own note below says.
 *
 * So the bands come from `PUBLISHED_VIDEO_CREDITS_PER_SECOND` in
 * `pricingData.ts`, which is the same table the pricing page shows and the only
 * place in this app a published credit figure is written. It is checked against
 * the 70% margin floor where it is defined.
 */
import {
  PUBLISHED_VIDEO_CREDITS_PER_SECOND,
  type PublishedVideoResolution,
} from "@/components/landing/pricing/pricingData";

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
  // be wrong in. 4K is the same price either way, so the flag cannot hurt there.
  const withAudio = options.withAudio !== false;
  const band =
    PUBLISHED_VIDEO_CREDITS_PER_SECOND[resolution as PublishedVideoResolution] ??
    PUBLISHED_VIDEO_CREDITS_PER_SECOND[
      DEFAULT_VIDEO_RESOLUTION as PublishedVideoResolution
    ];
  const perSecond = withAudio ? band.audio : band.silent;
  return perSecond * seconds;
}
