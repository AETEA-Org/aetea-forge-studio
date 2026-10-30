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
  const accent = accentFor(plan.data?.plan_id);
  const expiryDate = formatDate(balance.data?.next_expiry_at);
  const periodEnd = plan.data?.current_period_end;
  const periodEndOn = formatDate(periodEnd);

  // `current_period_end` is the end of the paid period, not a promise to renew.
  // A cancelled subscription keeps sending one, so the pane told the owner
  // "Renews 29 October" on 30 October, for a plan cancelled a month earlier and
  // a balance of zero. The date was never wrong; only the verb was. Anything
  // other than "canceled" — including `past_due`, where Stripe is still
  // retrying the card, and a status we do not recognise — is still running, so
  // it keeps the wording we would have shown anyway rather than a guess.
  //
  // `cancel_at_period_end` is what actually answers "will this renew". For the
  // month between a cancellation and the period ending, Stripe keeps the status
  // at "active", so status alone would still promise a renewal for the state a
  // customer spends most of that month in. `canceled_at` is deliberately not
  // used for the verb — it says when they asked, not whether it still stands.
  const cancelled =
    plan.data?.status === "canceled" || plan.data?.cancel_at_period_end === true;
  const periodEndPassed =
    !!periodEnd && new Date(periodEnd).getTime() <= Date.now();
  const periodVerb = !cancelled ? "Renews" : periodEndPassed ? "Ended" : "Ends";
  // The reason, which is the half of the complaint the verb does not answer:
  // "your plan ended" without "because you cancelled on 30 September" leaves a
  // zero balance looking like a fault. Omitted when we never recorded it.
  const cancelledOn = cancelled ? formatDate(plan.data?.canceled_at) : null;

  // **Over, not current.** A plan whose period has run out is not the plan
  // someone is on, and showing it as one was the rest of the complaint: the
  // pane still led with "Spire · Monthly", the plan dialog still badged Spire
  // CURRENT with its button disabled to "Your plan", and the balance still
  // claimed 19,900 credits were granted every month to an account that is
  // granted nothing. Changing the verb to "Ended" left all three standing.
  const planEnded = cancelled && periodEndPassed;

  // Only a plan that will actually grant again says what it grants. A
  // cancelled plan makes no further grants even while it runs out its last
  // paid period, so this is gated on the cancellation rather than on the end
  // date. It doubles as the balance bar's scale, which is why it is read once.
  const grant = cancelled ? null : grantFor(plan.data?.plan_id);
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
          ) : planEnded ? (
            // What happened, and the way back — not a plan panel for a plan
            // that is over. "Payment & invoices" stays, because past invoices
            // are exactly what someone wants after a plan ends.
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
              <span className="min-w-0 flex-1 text-sm text-muted-foreground">
                Your {planName ?? "previous"} plan ended on {periodEndOn}
                {cancelledOn && <>, because you cancelled on {cancelledOn}</>}.
              </span>
              <span className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setPlansOpen(true)}>
                  See plans
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
                  {/* A one-time purchase has no billing period, and this used
                      to read it as monthly because anything that was not
                      "annual" fell through to it — so an £8 Start pack was
                      labelled "Start · Monthly". Named only when there is one. */}
                  {plan.data?.billing_period === "annual"
                    ? " · Annual"
                    : plan.data?.billing_period === "monthly"
                      ? " · Monthly"
                      : ""}
                </span>
                {periodEndOn && (
                  <span className="text-xs text-muted-foreground">
                    {periodVerb} {periodEndOn}
                    {cancelledOn && <> · you cancelled on {cancelledOn}</>}
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
        // Null once it is over, so the dialog stops badging a finished plan
        // CURRENT and greying its button to "Your plan" — which left someone
        // with no plan unable to choose the one they had just lost.
        currentPlanId={planEnded ? null : plan.data?.plan_id}
      />
    </div>
  );
}
