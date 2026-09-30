import { useMemo } from "react";
import { useUsage } from "@/hooks/useBilling";
import { UsageTable } from "./UsageTable";
import { formatCredits } from "./format";
import type { UsageEvent } from "@/services/billing";

const DAYS = 30;

/**
 * Its own tab, not a third section under Billing.
 *
 * Billing answers "what am I on and how do I pay"; usage answers "where did it
 * go". They are looked at at different moments and for different reasons, and
 * stacking a long history under the payment controls buries both.
 *
 * The shape of the month goes above the log, because the first question is
 * whether spending is steady or whether one day did most of it — and a list
 * sorted newest-first can only answer that by being read in full.
 */

/** Credits per day for the last 30 days, oldest first. */
function dailyTotals(events: UsageEvent[] | undefined): number[] {
  const buckets = new Array<number>(DAYS).fill(0);
  if (!events?.length) return buckets;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  for (const event of events) {
    const date = new Date(event.created_at);
    if (Number.isNaN(date.getTime())) continue;
    const day = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    ).getTime();
    const ago = Math.round((today - day) / 86_400_000);
    // Anything older than the window, or dated in the future by a clock skew,
    // is left out rather than piled onto an end bucket.
    if (ago < 0 || ago >= DAYS) continue;
    buckets[DAYS - 1 - ago] += event.credits_charged || 0;
  }
  return buckets;
}

export function UsagePane() {
  const usage = useUsage(200);
  const totals = useMemo(() => dailyTotals(usage.data), [usage.data]);
  const spent = totals.reduce((sum, value) => sum + value, 0);
  const peak = Math.max(...totals, 1);

  const firstLabel = new Date(
    Date.now() - (DAYS - 1) * 86_400_000,
  ).toLocaleDateString(undefined, { day: "numeric", month: "short" });

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Last 30 days
          </span>
          <span className="text-sm text-muted-foreground">
            <span className="font-price text-base tabular-nums text-foreground">
              {formatCredits(spent)}
            </span>{" "}
            credits
          </span>
        </div>

        <div
          className="flex h-12 items-end gap-[2px]"
          role="img"
          aria-label={`Credits used per day over the last ${DAYS} days. ${formatCredits(spent)} in total.`}
        >
          {totals.map((value, index) => (
            <span
              key={index}
              className={cnBar(value, peak)}
              style={{ height: `${Math.max(2, (value / peak) * 100)}%` }}
              title={`${formatCredits(value)} credits`}
            />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
          <span>{firstLabel}</span>
          <span>Today</span>
        </div>
      </section>

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

/** The busiest day is the one worth picking out; the rest are context. */
function cnBar(value: number, peak: number): string {
  const base = "flex-1 rounded-[1px] min-h-[2px] block";
  if (value === 0) return `${base} bg-muted`;
  return value >= peak ? `${base} bg-primary` : `${base} bg-primary/45`;
}
