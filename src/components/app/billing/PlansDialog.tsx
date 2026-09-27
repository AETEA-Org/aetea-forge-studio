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
 */
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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose a plan</DialogTitle>
          <DialogDescription>
            Credits arrive every month. Change or cancel at any time.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center">
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
        </div>

        <div className="mt-2 space-y-3">
          {PRICING_PLANS.map((plan) => {
            const price = getPlanPrice(plan, period);
            const current = currentPlanId === plan.id;
            return (
              <div
                key={plan.id}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4",
                  current ? "border-primary/50 bg-primary/5" : "border-border",
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{plan.name}</span>
                    {current && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {plan.specs[0]}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="whitespace-nowrap text-lg font-semibold">
                    {price.price}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      {price.priceUnit}
                    </span>
                  </span>
                  <Button
                    size="sm"
                    variant={current ? "outline" : "default"}
                    disabled={current || pending !== null}
                    onClick={() => buy(plan.id as PlanId)}
                  >
                    {pending === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : current ? (
                      "Current plan"
                    ) : (
                      "Choose"
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
