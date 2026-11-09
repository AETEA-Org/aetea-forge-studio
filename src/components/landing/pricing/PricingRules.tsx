import {
  PRICING_BODY,
  PRICING_SECTION_TITLE,
} from "./pricingStyles";

type PricingRulesProps = {
  rules: string[];
};

export function PricingRules({ rules }: PricingRulesProps) {
  return (
    <section className="relative mt-6">
      <div className="container px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.35fr] lg:items-start">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2">
              <h2 className={`shrink-0 ${PRICING_SECTION_TITLE} text-foreground`}>
                Credit rules
              </h2>
              <div aria-hidden="true" className="h-px min-w-0 flex-1 translate-y-[2px] bg-border" />
            </div>
          </div>

          <ul className={`max-w-4xl space-y-3 lg:pt-3.5 ${PRICING_BODY}`}>
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
