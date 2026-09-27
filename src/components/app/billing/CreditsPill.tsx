import { useNavigate } from "react-router-dom";
import { Coins } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useBalance } from "@/hooks/useBilling";
import { formatCredits, formatDate } from "./format";

/**
 * The balance, in the app chrome.
 *
 * **Quiet until it matters.** A balance nobody needs to think about should not
 * compete with the work; a balance about to run out should be impossible to
 * miss. Same component, three states, driven by the number alone.
 *
 * It never renders `0` while loading. Showing zero before the fetch lands would
 * tell someone with a full balance that they are broke, and one sighting of
 * that is enough to stop them trusting the figure at all.
 */

/** Below this, the balance is worth noticing. Roughly one substantial job. */
const LOW_CREDITS = 300;

export function CreditsPill({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useBalance();

  if (isLoading) {
    return <Skeleton className={cn("h-7 w-20 rounded-full", className)} />;
  }

  // A balance we could not read is not a balance of zero. Say nothing rather
  // than something wrong.
  if (isError || !data) return null;

  const credits = data.credits ?? 0;
  const empty = credits <= 0;
  const low = !empty && credits < LOW_CREDITS;
  const expiryDate = formatDate(data.next_expiry_at);

  const pill = (
    <button
      type="button"
      onClick={() => navigate("/app/settings?tab=billing")}
      aria-label={`${formatCredits(credits)} credits. Open billing.`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        empty
          ? "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15"
          : low
            ? "border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500/15"
            : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        className,
      )}
    >
      <Coins className="h-3.5 w-3.5" />
      {empty ? "Add credits" : formatCredits(credits)}
    </button>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{pill}</TooltipTrigger>
        <TooltipContent side="bottom">
          {empty ? (
            <span>You're out of credits. Add more to carry on.</span>
          ) : (
            <span>
              {formatCredits(credits)} credits
              {data.expiring_next > 0 && expiryDate && (
                <>
                  {" · "}
                  {formatCredits(data.expiring_next)} expire {expiryDate}
                </>
              )}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
