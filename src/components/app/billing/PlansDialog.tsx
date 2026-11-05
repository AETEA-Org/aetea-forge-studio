import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PRICING_PLANS,
  getPlanPrice,
  type BillingPeriod,
  type PricingPlan,
} from "@/components/landing/pricing/pricingData";
import { useCheckout } from "@/hooks/useBilling";
import { useToast } from "@/hooks/use-toast";
import type { PlanId } from "@/services/billing";

/**
 * Choose a plan without leaving the app.
 *
 * Sending someone from their billing settings out to the marketing page to buy
 * something is a strange journey: they have already decided to be a customer,
 * and the pricing page is built to persuade a stranger. This shows the same
 * four plans, with the same figures from the same source, and buys in place.
 *
 * The pricing page keeps its own copy of this flow — it serves people who are
 * not signed in and has to handle that. This one can assume a customer.
 *
 * **Every spec line shows, not just the first.** Rendering `specs[0]` alone
 * dropped "Open for 72 hours" and "No renewal" from Start, which are the two
 * things somebody has to know before buying it. The plan's own accent does the
 * identifying, as a thin cap rather than the pricing page's full card — the
 * wordmark and brush type belong on the page that sells, not in a settings
 * dialog someone opened to change a plan they already have.
 */

/** A plan with no recurring price is bought once and never renews. */
function isOneTime(plan: PricingPlan): boolean {
  return !!plan.oneTime;
}

function PlanCard({
  plan,
  period,
  current,
  pending,
  disabled,
  onChoose,
}: {
  plan: PricingPlan;
  period: BillingPeriod;
  current: boolean;
  pending: boolean;
  disabled: boolean;
  onChoose: () => void;
}) {
  const price = getPlanPrice(plan, period);
  const oneTime = isOneTime(plan);

  // Annual savings are worth as much as the specs and are only mentioned on the
  // price the saving applies to.
  const specs = [...plan.specs];
  if (!oneTime && period === "annual" && price.savingsNote) {
    // "save $38 | 17% annual saving" reads as two facts; the money is the one
    // that matters next to a price.
    specs.push(price.savingsNote.split("|")[0].trim().replace(/^save/i, "Save"));
  }

  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-col gap-3 overflow-hidden rounded-xl border p-4",
        current ? "border-[var(--plan-accent)]" : "border-border",
      )}
      style={{ ["--plan-accent" as string]: plan.accent }}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: plan.accent }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display text-lg font-bold tracking-tight">
          {plan.name}
        </span>
        {current && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-background"
            style={{ background: plan.accent }}
          >
            Current
          </span>
        )}
      </div>

      <p className="min-h-[2.6em] text-xs leading-snug text-muted-foreground">
        {plan.tagline}
      </p>

      <div className="flex items-baseline gap-1.5">
        <span className="font-price text-3xl leading-none">{price.price}</span>
        <span className="text-xs text-muted-foreground">{price.priceUnit}</span>
      </div>

      <div className="flex flex-col gap-1.5 border-y border-border/60 py-3">
        {specs.map((spec, index) => (
          <span key={spec} className="flex items-start gap-2 text-xs">
            <span
              aria-hidden
              className="mt-[7px] h-1 w-1 shrink-0 rounded-full"
              style={{ background: plan.accent }}
            />
            <span
              className={index === 0 ? "font-semibold" : "text-muted-foreground"}
            >
              {spec}
            </span>
          </span>
        ))}
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-foreground/70">
          Example
        </span>
        {plan.exampleCredits}
      </p>

      <Button
        size="sm"
        variant={current ? "outline" : "default"}
        disabled={current || disabled}
        onClick={onChoose}
        className="mt-auto w-full"
        style={
          current ? undefined : { background: plan.accent, color: "#fff" }
        }
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : current ? (
          "Your plan"
        ) : oneTime ? (
          "Buy once"
        ) : (
          `Switch to ${plan.name}`
        )}
      </Button>
    </div>
  );
}

export function PlansDialog({
  open,
  onOpenChange,
  currentPlanId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanId?: string | null;
}) {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [pending, setPending] = useState<string | null>(null);
  const checkout = useCheckout();
  const { toast } = useToast();

  const buy = (planId: PlanId) => {
    setPending(planId);
    checkout.mutate(
      { planId, billingPeriod: period === "annual" ? "annual" : "monthly" },
      {
        onError: (error) => {
          setPending(null);
          toast({
            title: "Could not start checkout",
            description:
              error instanceof Error ? error.message : "Please try again shortly.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Choose a plan</DialogTitle>
          {/* Not "credits arrive every month": Start is a one-time purchase that
              expires in 72 hours, and it sits in this same list. */}
          <DialogDescription>
            Subscriptions grant credits every month and can be changed or
            cancelled at any time. Start is a one-time purchase.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex rounded-full border border-border p-0.5">
            {(["monthly", "annual"] as BillingPeriod[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPeriod(option)}
                aria-pressed={period === option}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm capitalize transition-colors",
                  period === option
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option}
              </button>
            ))}
          </div>
          {period === "annual" && (
            <span className="text-xs font-semibold text-emerald-500">
              Save up to 17%
            </span>
          )}
        </div>

        <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRICING_PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              period={period}
              current={currentPlanId === plan.id}
              pending={pending === plan.id}
              disabled={pending !== null}
              onChoose={() => buy(plan.id as PlanId)}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
