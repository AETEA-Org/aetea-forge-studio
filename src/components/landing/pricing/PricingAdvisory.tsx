import { AdvisoryBookButton } from "../advisory/AdvisoryBookButton";
import { PRICING_BODY, PRICING_SECTION_TITLE } from "./pricingStyles";

export function PricingAdvisory() {
  return (
    <section aria-labelledby="pricing-advisory-title" className="relative mt-6">
      <div className="container px-6 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div aria-hidden="true" className="h-px w-12 shrink-0 bg-border" />
            <h2 id="pricing-advisory-title" className={`min-w-0 ${PRICING_SECTION_TITLE} text-foreground`}>
              The 80 Ones Advisory
            </h2>
            <div aria-hidden="true" className="h-px w-12 shrink-0 bg-border" />
          </div>
          <p className={`mb-8 ${PRICING_BODY}`}>
            The Advisory is a separate engagement with Ash Tal. Fees are quoted after a complimentary conversation to establish fit and scope. An AETEA subscription does not include the Advisory, and an Advisory engagement does not require an AETEA subscription.
          </p>
          <AdvisoryBookButton />
        </div>
      </div>
    </section>
  );
}
