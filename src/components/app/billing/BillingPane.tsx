import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useBalance, usePlan, usePortal } from "@/hooks/useBilling";
import { PRICING_PLANS } from "@/components/landing/pricing/pricingData";
import { PlansDialog } from "./PlansDialog";
import { TopUpDialog } from "./TopUpDialog";
import { formatCredits, formatDate } from "./format";

/**
 * What I am on, and how much is left.
 *
 * The balance leads, because it is the only figure on this tab someone comes
 * back to check. The bar under it splits what expires soon from the rest: a
 * balance with an expiry buried in a sentence beneath it is how somebody loses
 * credits they thought they had.
 */

/** The monthly grant for a plan, so the balance bar has something to fill. */
function grantFor(planId: string | null | undefined): number | null {
  const plan = PRICING_PLANS.find((candidate) => candidate.id === planId);
  if (!plan) return null;
  const spec = plan.specs.find((line) => /credit/i.test(line));
  const digits = spec?.replace(/[^0-9]/g, "");
  return digits ? Number(digits) : null;
}

function accentFor(planId: string | null | undefined): string | null {
  return PRICING_PLANS.find((candidate) => candidate.id === planId)?.accent ?? null;
}

export function BillingPane() {
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const balance = useBalance();
  const plan = usePlan();
  const portal = usePortal();
  const { toast } = useToast();

  const credits = balance.data?.credits ?? 0;
  const expiring = balance.data?.expiring_next ?? 0;
  const grant = grantFor(plan.data?.plan_id);
  const accent = accentFor(plan.data?.plan_id);
  const expiryDate = formatDate(balance.data?.next_expiry_at);
  const renewsOn = formatDate(plan.data?.current_period_end);
  const planName =
    PRICING_PLANS.find((candidate) => candidate.id === plan.data?.plan_id)?.name ??
    null;

  // Two segments of one bar: what is safe, and what goes away first. Widths are
  // against the plan's own monthly grant, so "how full is this" means something.
  const scale = grant && grant > 0 ? grant : Math.max(credits, 1);
  const safePct = Math.min(100, ((credits - expiring) / scale) * 100);
  const expiringPct = Math.min(100 - safePct, (expiring / scale) * 100);

  const openPortal = () =>
    portal.mutate(undefined, {
      onSuccess: (url) => {
        if (!url) {
          toast({
            title: "Nothing to manage yet",
            description:
              "You don't have a subscription. Choose a plan to start one.",
          });
        }
      },
      onError: () =>
        toast({
          title: "Could not open the billing portal",
          description: "Please try again shortly.",
          variant: "destructive",
        }),
    });

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------------------------ */}
      {/* Balance                                                             */}
      {/* ------------------------------------------------------------------ */}
      {balance.isLoading ? (
        <Skeleton className="h-44 w-full rounded-xl" />
      ) : balance.isError ? (
        <div className="rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground">
            Couldn't load your balance.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => balance.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : (
        <section className="rounded-xl border border-border p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Balance
            </span>
            <Button size="sm" variant="outline" onClick={() => setTopUpOpen(true)}>
              Add credits
            </Button>
          </div>

          <div className="flex items-end gap-2">
            <span className="font-price text-5xl leading-none tabular-nums">
              {formatCredits(credits)}
            </span>
            <span className="pb-1 text-sm text-muted-foreground">credits</span>
          </div>

          <div className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-muted">
            <span
              className="h-full"
              style={{
                width: `${Math.max(0, safePct)}%`,
                background: accent ?? "hsl(var(--primary))",
              }}
            />
            {expiringPct > 0 && (
              <span
                className="h-full bg-amber-500"
                style={{ width: `${expiringPct}%` }}
              />
            )}
          </div>

          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {grant && (
              <span>{formatCredits(grant)} granted each month</span>
            )}
            {expiring > 0 && expiryDate ? (
              <span className="text-amber-500">
                {formatCredits(expiring)} expire on {expiryDate}
              </span>
            ) : (
              <span>Bought credits stay valid for three months</span>
            )}
          </div>

          {/* -------------------------------------------------------------- */}
          {/* Plan                                                            */}
          {/* -------------------------------------------------------------- */}
          {plan.isLoading ? (
            <Skeleton className="mt-5 h-12 w-full rounded-lg" />
          ) : planName ? (
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  background: accent ?? "hsl(var(--primary))",
                  boxShadow: `0 0 0 3px ${accent ?? "hsl(var(--primary))"}28`,
                }}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">
                  {planName}
                  {plan.data?.billing_period === "annual" ? " · Annual" : " · Monthly"}
                </span>
                {renewsOn && (
                  <span className="text-xs text-muted-foreground">
                    Renews {renewsOn}
                  </span>
                )}
              </span>
              <span className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setPlansOpen(true)}>
                  Change plan
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openPortal}
                  disabled={portal.isPending}
                >
                  {portal.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  )}
                  Payment &amp; invoices
                </Button>
              </span>
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
              <span className="min-w-0 flex-1 text-sm text-muted-foreground">
                You're not on a plan yet.
              </span>
              <Button size="sm" onClick={() => setPlansOpen(true)}>
                See plans
              </Button>
            </div>
          )}
        </section>
      )}

      <TopUpDialog open={topUpOpen} onOpenChange={setTopUpOpen} />
      <PlansDialog
        open={plansOpen}
        onOpenChange={setPlansOpen}
        currentPlanId={plan.data?.plan_id}
      />
    </div>
  );
}
