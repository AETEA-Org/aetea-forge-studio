import type { CSSProperties } from "react";
import type { PricingFaqItem } from "./pricingData";
import {
  PRICING_BODY,
  PRICING_SECTION_TITLE,
  PRICING_SUBHEADING,
} from "./pricingStyles";

type PricingFaqProps = {
  items: PricingFaqItem[];
};

export function PricingFaq({ items }: PricingFaqProps) {
  return (
    <section className="relative mt-6 pb-16 md:pb-28">
      <div className="container px-6 lg:px-12">
        <div className="mb-10 max-w-2xl border-l-2 border-foreground/20 pl-4 sm:pl-6 lg:pl-8">
            <h2 className={`${PRICING_SECTION_TITLE} text-foreground`}>FAQs</h2>
        </div>

        <div
          className="mx-auto max-w-5xl grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-2 lg:grid-flow-col lg:grid-rows-[repeat(var(--faq-rows),auto)]"
          style={{ "--faq-rows": Math.max(1, Math.ceil(items.length / 2)) } as CSSProperties}
        >
          {items.map((item, index) => (
            <div key={item.question} className="min-w-0">
              <h3 className={`mb-2 ${PRICING_SUBHEADING}`}>
                <span className="mr-2 font-mono text-xs font-normal text-primary">{String(index + 1).padStart(2, "0")}</span>{" "}
                {item.question}
              </h3>
              <p className={PRICING_BODY}>
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
