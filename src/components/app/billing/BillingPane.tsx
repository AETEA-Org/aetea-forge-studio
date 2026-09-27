import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  useBalance,
  usePlan,
  usePortal,
} from "@/hooks/useBilling";
import { PRICING_PLANS } from "@/components/landing/pricing/pricingData";
import { PlansDialog } from "./PlansDialog";
import { TopUpDialog } from "./TopUpDialog";
import { formatCredits, formatDate } from "./format";

/** The monthly grant for a plan, so the balance bar has something to fill. */
function grantFor(planId: string | null | undefined): number | null {
  const plan = PRICING_PLANS.find((candidate) => candidate.id === planId);
  if (!plan) return null;
  const spec = plan.specs.find((line) => /credit/i.test(line));
  const digits = spec?.replace(/[^0-9]/g, "");
  return digits ? Number(digits) : null;
}

export function BillingPane() {
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const balance = useBalance();
  const plan = usePlan();
  const portal = usePortal();
  const { toast } = useToast();


  const credits = balance.data?.credits ?? 0;
  const grant = grantFor(plan.data?.plan_id);
  const expiryDate = formatDate(balance.data?.next_expiry_at);
  const renewsOn = formatDate(plan.data?.current_period_end);
  const planName =
    PRICING_PLANS.find((candidate) => candidate.id === plan.data?.plan_id)?.name ??
    null;

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------- */}
      {/* Plan                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section>
        <h2 className="mb-4 font-medium">Plan</h2>
        {plan.isLoading ? (
          <Skeleton className="h-16 w-full rounded-lg" />
        ) : planName ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-4">
            <div>
              <p className="text-lg font-semibold">{planName}</p>
              <p className="text-sm text-muted-foreground">
                {plan.data?.billing_period === "annual" ? "Annual" : "Monthly"}
                {renewsOn && ` · Renews ${renewsOn}`}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() =>
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
                })
              }
              disabled={portal.isPending}
            >
              {portal.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              Manage subscription
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              You're not on a plan yet.
            </p>
            <Button className="mt-4" onClick={() => setPlansOpen(true)}>
              See plans
            </Button>
          </div>
        )}
      </section>

      <Separator />

      {/* ---------------------------------------------------------------- */}
      {/* Credits                                                           */}
      {/* ---------------------------------------------------------------- */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-medium">Credits</h2>
          <Button size="sm" onClick={() => setTopUpOpen(true)}>
            Add credits
          </Button>
        </div>

        {balance.isLoading ? (
          <Skeleton className="h-20 w-full rounded-lg" />
        ) : balance.isError ? (
          <div className="rounded-lg border border-border p-4">
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
          <div className="rounded-lg border border-border p-5">
            <p className="text-4xl font-semibold tabular-nums">
              {formatCredits(credits)}
              <span className="ml-2 text-base font-normal text-muted-foreground">
                credits
              </span>
            </p>

            {grant ? (
              <Progress
                value={Math.min(100, (credits / grant) * 100)}
                className="mt-4 h-1.5"
              />
            ) : null}

            {/* Always stated, not only when close. A balance with no expiry
                attached is precisely the complaint this design invites. */}
            {balance.data && balance.data.expiring_next > 0 && expiryDate ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {formatCredits(balance.data.expiring_next)} expire on{" "}
                {expiryDate}.
              </p>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Monthly credits are for the current month. Credits you buy stay
                valid for three months.
              </p>
            )}
          </div>
        )}
      </section>

      <TopUpDialog open={topUpOpen} onOpenChange={setTopUpOpen} />
      <PlansDialog
        open={plansOpen}
        onOpenChange={setPlansOpen}
        currentPlanId={plan.data?.plan_id}
      />
    </div>
  );
}
