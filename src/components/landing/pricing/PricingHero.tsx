import { PRICING_PAGE_TITLE } from "./pricingStyles";

export function PricingHero() {
  return (
    <section className="relative overflow-hidden pb-8 pt-28 md:pb-6 md:pt-36">
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-background" />
      <div className="container relative z-10 px-6 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className={`${PRICING_PAGE_TITLE} text-white/60`}>
            Pricing &amp; Packages
          </h1>
        </div>
      </div>
    </section>
  );
}
