import type { PricingFaqItem } from "./pricingData";

type PricingFaqProps = {
  items: PricingFaqItem[];
};

export function PricingFaq({ items }: PricingFaqProps) {
  return (
    <section className="relative py-16 md:pb-28 md:pt-24">
      <div className="container px-6 lg:px-12">
        <div className="mb-10 max-w-2xl">
          <div className="mb-4 h-1.5 w-40 bg-white/40 sm:w-64" />
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            FAQ&apos;s
          </h2>
        </div>

        <div className="mx-auto max-w-5xl grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-2">
          {items.map((item) => (
            <div key={item.question} className="min-w-0">
              <h3 className="mb-2 text-base font-bold text-foreground sm:text-lg">
                {item.question}
              </h3>
              <p className="text-sm leading-relaxed text-foreground/75 sm:text-base">
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
