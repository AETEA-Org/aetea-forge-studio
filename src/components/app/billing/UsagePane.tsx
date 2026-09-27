import { useUsage } from "@/hooks/useBilling";
import { UsageTable } from "./UsageTable";

/**
 * Its own tab, not a third section under Billing.
 *
 * Billing answers "what am I on and how do I pay"; usage answers "where did it
 * go". They are looked at at different moments and for different reasons, and
 * stacking a long history under the payment controls buries both.
 */
export function UsagePane() {
  const usage = useUsage(200);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-medium">Usage</h2>
        <p className="text-sm text-muted-foreground">
          What you've used credits on, newest first.
        </p>
      </div>
      <UsageTable events={usage.data} isLoading={usage.isLoading} />
    </div>
  );
}
