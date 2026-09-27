import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * What someone sees when they run out mid-conversation.
 *
 * Deliberately **not** a red error. Nothing went wrong: they used the product
 * and the credits ran out, which is the system working. A destructive banner
 * carrying a server sentence — which is what this replaces — makes a normal
 * commercial moment look like a fault, and the first thing a customer does with
 * a product that looks broken is stop trusting it with their work.
 *
 * So: calm surface, the reassurance first, and two ways forward.
 */
export function OutOfCredits({
  onTopUp,
  className,
  compact = false,
}: {
  onTopUp: () => void;
  className?: string;
  /** Inline in a conversation, rather than filling a settings pane. */
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-muted/30 text-center",
        compact ? "p-5" : "p-8",
        className,
      )}
    >
      <h3 className={cn("font-medium", compact ? "text-base" : "text-lg")}>
        You're out of credits
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Everything you've made is saved. Add credits to pick up where you left
        off.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={onTopUp}>Add credits</Button>
        <Button variant="outline" asChild>
          <Link to="/pricing">See plans</Link>
        </Button>
      </div>
    </div>
  );
}
