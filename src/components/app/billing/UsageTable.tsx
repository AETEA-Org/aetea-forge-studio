import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { UsageEvent } from "@/services/billing";
import { formatCredits, tierLabel } from "./format";

const PAGE = 25;

/**
 * What the customer has spent credits on.
 *
 * Three rules hold this together.
 *
 * **One row per thing they asked for**, not per provider call. A campaign build
 * is one line here even though it was forty calls underneath; the backend does
 * that grouping, and showing the forty would be an accurate answer to a
 * question nobody asked.
 *
 * **Nothing technical reaches this table.** Names come from the backend already
 * human-readable, so no vendor, model or action code can appear even by
 * accident — the failure mode of a local code-to-name map is that a new action
 * shows up as `video.generate`.
 *
 * **The day is said once.** A table that repeats the full date on every line
 * spends its widest column restating something that changed twice. Rows are
 * grouped under a day heading and carry only a time.
 */

/** "Today" / "Yesterday" / "29 September", for a group heading. */
function dayLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Earlier";
  const start = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((start(new Date()) - start(date)) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    ...(date.getFullYear() === new Date().getFullYear() ? {} : { year: "numeric" }),
  });
}

function timeLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Tier decides most of why one piece of work cost more than another, so it is
 * the one thing here worth colouring. These are AETEA's own names — no vendor
 * or model reaches this file.
 */
const TIER_CLASS: Record<string, string> = {
  "aetea-max": "border-violet-500/30 bg-violet-500/10 text-violet-300",
  aetea: "border-primary/30 bg-primary/10 text-primary",
  "aetea-lite": "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

function groupByDay(events: UsageEvent[]): [string, UsageEvent[]][] {
  const groups: [string, UsageEvent[]][] = [];
  for (const event of events) {
    const label = dayLabel(event.created_at);
    const last = groups[groups.length - 1];
    // The list arrives newest-first and stays in that order, so a run of rows
    // sharing a day is always contiguous.
    if (last && last[0] === label) last[1].push(event);
    else groups.push([label, [event]]);
  }
  return groups;
}

export function UsageTable({
  events,
  isLoading,
}: {
  events: UsageEvent[] | undefined;
  isLoading: boolean;
}) {
  const [shown, setShown] = useState(PAGE);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!events?.length) {
    return (
      <div className="rounded-lg border border-dashed border-border py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Nothing yet. Work you do will show up here with what it cost.
        </p>
      </div>
    );
  }

  const groups = groupByDay(events.slice(0, shown));

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border px-4 pb-2">
        {groups.map(([day, rows]) => (
          <div key={day}>
            <p className="pb-1.5 pt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {day}
            </p>
            {rows.map((event) => {
              // The backend's own record of a turn that stopped partway: its
              // cost was self-counted because a cancelled stream never delivers
              // its usage chunk. Never inferred from `status`, which is the
              // literal "settled" on every row ever written.
              const stopped = event.is_estimated === true;
              const tier = tierLabel(event.tier);
              return (
                <div
                  key={event.id}
                  className="flex items-center gap-3 border-t border-border/50 py-2.5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">
                      {event.display_name}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {timeLabel(event.created_at)}
                      </span>
                      {tier && (
                        <span
                          className={cn(
                            "rounded border px-1.5 text-[10px] font-semibold",
                            TIER_CLASS[event.tier ?? ""] ??
                              "border-border text-muted-foreground",
                          )}
                        >
                          {tier}
                        </span>
                      )}
                      {stopped && (
                        <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 text-[10px] font-semibold text-amber-400">
                          Stopped partway
                        </span>
                      )}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 font-price text-base tabular-nums",
                      event.credits_charged === 0 && "text-muted-foreground",
                    )}
                  >
                    {formatCredits(event.credits_charged)}
                    <span className="ml-1 font-sans text-[10px] text-muted-foreground">
                      cr
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {events.length > shown && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShown((current) => current + PAGE)}
          >
            Show more
          </Button>
        </div>
      )}
    </div>
  );
}
