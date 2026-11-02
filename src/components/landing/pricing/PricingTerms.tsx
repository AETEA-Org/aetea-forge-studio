import { Link } from "react-router-dom";
import { PRICING_BODY, PRICING_SECTION_TITLE } from "./pricingStyles";

export function PricingTerms() {
  return (
    <section aria-labelledby="pricing-terms-title" className="relative pb-16 md:pb-28">
      <div className="container px-6 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div aria-hidden="true" className="h-px w-12 shrink-0 bg-border" />
            <h2 id="pricing-terms-title" className={`min-w-0 ${PRICING_SECTION_TITLE} text-foreground`}>
              Terms &amp; Conditions
            </h2>
            <div aria-hidden="true" className="h-px w-12 shrink-0 bg-border" />
          </div>
          <p className={PRICING_BODY}>
            Plan, price, tax, credit allocation, and billing details are confirmed at checkout. See{" "}
            <Link to="/terms" className="underline underline-offset-4">Terms &amp; Conditions</Link>{" "}
            and <Link to="/privacy" className="underline underline-offset-4">Privacy Policy</Link>{" "}
            for full information. Questions: support@aetea.studio.
          </p>
        </div>
      </div>
    </section>
  );
}
