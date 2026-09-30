import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { UsageEvent } from "@/services/billing";
import { formatCredits, formatDateTime, tierLabel } from "./format";

const PAGE = 25;

/**
 * What the customer has spent credits on.
 *
 * Two rules hold this together.
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
 */
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

  const visible = events.slice(0, shown);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">What</th>
              <th className="hidden px-4 py-2.5 text-left font-medium sm:table-cell">
                When
              </th>
              <th className="px-4 py-2.5 text-right font-medium">Credits</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((event) => {
              // Read from the backend's own record of an interrupted turn, not
              // guessed from `status`. Every row the meter writes carries the
              // literal "settled", which matched none of the words this once
              // tested for, so every row in the history claimed to be stopped.
              const stopped = event.is_estimated === true;
              const tier = tierLabel(event.tier);
              return (
                <tr
                  key={event.id}
                  className="border-t border-border/60 align-middle"
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{event.display_name}</span>
                      {tier && (
                        <Badge variant="secondary" className="text-[10px]">
                          {tier}
                        </Badge>
                      )}
                      {stopped && (
                        <Badge variant="outline" className="text-[10px]">
                          Stopped
                        </Badge>
                      )}
                    </div>
                    {stopped && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Stopped partway — charged for what ran.
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">
                      {formatDateTime(event.created_at)}
                    </p>
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground sm:table-cell">
                    {formatDateTime(event.created_at)}
                  </td>
                  <td
                    className={cn(
                      "whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums",
                      event.credits_charged === 0 && "text-muted-foreground",
                    )}
                  >
                    {formatCredits(event.credits_charged)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
