import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { PricingHero } from "@/components/landing/pricing/PricingHero";
import { PricingTiers } from "@/components/landing/pricing/PricingTiers";
import { PricingCreditsTable } from "@/components/landing/pricing/PricingCreditsTable";
import { PricingAddons } from "@/components/landing/pricing/PricingAddons";
import { PricingRules } from "@/components/landing/pricing/PricingRules";
import { PricingFaq } from "@/components/landing/pricing/PricingFaq";
import {
  ADDONS_FOOTNOTE,
  CREDIT_ACTIONS,
  CREDIT_RULES,
  PACKAGE_VARIANTS_NOTE,
  PRICING_ADDONS,
  PRICING_FAQS,
  PRICING_PLANS,
  VARIABLE_ACTIONS_NOTE,
  type BillingPeriod,
  type PricingPlan,
} from "@/components/landing/pricing/pricingData";
import { PricingPackageVariantsNote } from "@/components/landing/pricing/PricingPackageVariantsNote";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { startCheckout, type PlanId } from "@/services/billing";
import {
  rememberCheckoutIntent,
  takeCheckoutIntent,
} from "@/services/checkoutIntent";

export default function Pricing() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);

  const go = async (planId: PlanId, billingPeriod: BillingPeriod) => {
    setPendingPlanId(planId);
    try {
      const url = await startCheckout({
        planId,
        billingPeriod: billingPeriod === "annual" ? "annual" : "monthly",
      });
      window.location.href = url;
    } catch (error) {
      setPendingPlanId(null);
      toast({
        title: "Could not start checkout",
        description:
          error instanceof Error ? error.message : "Please try again shortly.",
        variant: "destructive",
      });
    }
  };

  // Someone who pressed a plan before signing in comes back here with their
  // choice still intended. Picking it up automatically is the difference
  // between finishing a purchase and starting one again from scratch.
  useEffect(() => {
    if (loading || !user) return;
    const intent = takeCheckoutIntent();
    if (intent?.kind === "plan") {
      void go(intent.planId, intent.billingPeriod as BillingPeriod);
    }
    // `go` is stable enough for this one-shot resume; re-running on every
    // render would restart checkout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  const handleChoose = (plan: PricingPlan, billingPeriod: BillingPeriod) => {
    const planId = plan.id as PlanId;
    if (!user) {
      rememberCheckoutIntent({
        kind: "plan",
        planId,
        billingPeriod: billingPeriod === "annual" ? "annual" : "monthly",
      });
      navigate("/auth?next=/pricing");
      return;
    }
    void go(planId, billingPeriod);
  };

  return (
    <div className="min-h-screen bg-background dark">
      <Navbar />
      <main>
        <PricingHero />
        <PricingTiers
          plans={PRICING_PLANS}
          onChoose={handleChoose}
          pendingPlanId={pendingPlanId}
        />

        <PricingPackageVariantsNote note={PACKAGE_VARIANTS_NOTE} />

        <PricingCreditsTable
          rows={CREDIT_ACTIONS}
          variableNote={VARIABLE_ACTIONS_NOTE}
        />

        <PricingAddons addons={PRICING_ADDONS} footnote={ADDONS_FOOTNOTE} />
        <PricingRules rules={CREDIT_RULES} />
        <PricingFaq items={PRICING_FAQS} />
      </main>
      <Footer />
    </div>
  );
}
