import {
  PRICING_BODY,
  PRICING_EYEBROW,
  PRICING_SECTION_TITLE,
} from "./pricingStyles";

type PricingRulesProps = {
  rules: string[];
};

export function PricingRules({ rules }: PricingRulesProps) {
  return (
    <section className="relative py-16 md:py-24">
      <div className="container px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.35fr] lg:items-start">
          <div className="max-w-2xl">
            <p className={`mb-3 ${PRICING_EYEBROW}`}>
              Rules
            </p>
            <h2 className={`${PRICING_SECTION_TITLE} text-foreground`}>
              Clear credit rules
            </h2>
          </div>

          <ul className={`max-w-4xl space-y-3 ${PRICING_BODY}`}>
            {rules.map((rule) => (
              <li key={rule} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/70" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
