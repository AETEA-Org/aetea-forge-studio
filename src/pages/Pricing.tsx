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
} from "@/components/landing/pricing/pricingData";
import { PricingPackageVariantsNote } from "@/components/landing/pricing/PricingPackageVariantsNote";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background dark">
      <Navbar />
      <main>
        <PricingHero />
        <PricingTiers plans={PRICING_PLANS} />

        <PricingPackageVariantsNote note={PACKAGE_VARIANTS_NOTE} />

        <PricingCreditsTable rows={CREDIT_ACTIONS} />

        <PricingAddons addons={PRICING_ADDONS} footnote={ADDONS_FOOTNOTE} />
        <PricingRules rules={CREDIT_RULES} />
        <PricingFaq items={PRICING_FAQS} />
      </main>
      <Footer />
    </div>
  );
}
