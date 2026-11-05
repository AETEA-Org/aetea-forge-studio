import { PRICING_BODY, PRICING_PAGE_TITLE } from "./pricingStyles";

export function PricingHero() {
  return (
    <section className="relative overflow-hidden pt-28 md:pt-36">
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-background" />
      <div className="container relative z-10 px-6 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className={`${PRICING_PAGE_TITLE} text-white`}>
            Pricing
          </h1>
          <div className={`mx-auto mt-6 max-w-3xl space-y-4 ${PRICING_BODY}`}>
            <p>
              AETEA is intelligence at work, available by subscription. Choose a plan that matches your expected usage.
            </p>
            <p>
              Annual subscriptions provide 12 months for the price of 10, saving 16.7%. No volume discounts apply.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
