import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DEFAULT_VIDEO_RESOLUTION,
  DEFAULT_VIDEO_SECONDS,
  videoCreditsFor,
} from "./videoCost";
import { formatCredits } from "./format";

/**
 * Confirm a video render before it is submitted.
 *
 * A render cannot be recalled once it starts and is charged in full, so this is
 * the last moment the answer can still be no. It states the three things that
 * change the price — length, resolution, sound — and the price itself, because
 * "are you sure?" with no number is not a question anyone can answer.
 */
export function ConfirmVideoDialog({
  open,
  onOpenChange,
  onConfirm,
  resolution,
  seconds,
  withAudio,
  balance,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  resolution?: string;
  seconds?: number;
  withAudio?: boolean;
  balance?: number;
}) {
  const length = seconds || DEFAULT_VIDEO_SECONDS;
  const quality = resolution || DEFAULT_VIDEO_RESOLUTION;
  const sound = withAudio !== false;
  const credits = videoCreditsFor({ resolution: quality, seconds: length, withAudio: sound });
  const affordable = balance === undefined || balance >= credits;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Generate this video?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                {length} seconds at {quality}
                {sound ? " with sound" : " without sound"}.
              </p>
              <p className="text-foreground">
                This will use about{" "}
                <span className="font-semibold">{formatCredits(credits)} credits</span>.
              </p>
              {!affordable && (
                <p className="text-destructive">
                  That's more than your balance of {formatCredits(balance ?? 0)}.
                  Add credits, or make it shorter.
                </p>
              )}
              <p className="text-xs">
                Once a render starts it can't be stopped, and it's charged in
                full.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={!affordable}>
            Generate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
