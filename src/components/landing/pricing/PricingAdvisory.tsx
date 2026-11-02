import { AdvisoryBookButton } from "../advisory/AdvisoryBookButton";
import { PRICING_BODY, PRICING_SECTION_TITLE } from "./pricingStyles";

export function PricingAdvisory() {
  return (
    <section aria-labelledby="pricing-advisory-title" className="relative">
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
            The 80 Ones Advisory is a separate engagement with Ash Tal. Its fee is considered and quoted for the particular Advisory project, following an initial complimentary conversation and assessment of what the engagement requires. An AETEA subscription does not include the Advisory, and an Advisory engagement does not require an AETEA subscription.
          </p>
          <AdvisoryBookButton className="uppercase" />
        </div>
      </div>
    </section>
  );
}
