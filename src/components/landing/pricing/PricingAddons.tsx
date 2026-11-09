import type { PricingAddon } from "./pricingData";
import {
  PRICING_DISCLAIMER,
  PRICING_SECTION_TITLE,
} from "./pricingStyles";

type PricingAddonsProps = {
  addons: PricingAddon[];
  footnote: string;
};

export function PricingAddons({ addons, footnote }: PricingAddonsProps) {
  return (
    <section className="relative">
      <div className="mx-auto w-full max-w-[1100px] px-6 xl:px-0">
        <div className="mx-auto max-w-[560px]">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div aria-hidden="true" className="h-px w-12 bg-border" />
            <h2 className={`${PRICING_SECTION_TITLE} text-foreground`}>
              Add-ons
            </h2>
            <div aria-hidden="true" className="h-px w-12 bg-border" />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1a]">
          <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.6fr)_minmax(0,1.4fr)] gap-2 border-b border-black/60 px-4 py-4 text-center text-sm font-normal text-primary md:gap-4 md:px-8">
            <span>Credits</span>
            <span>Price</span>
            <span>Best for</span>
          </div>
          <ul>
            {addons.map((addon, index) => (
              <li
                key={addon.name}
                className={
                  index === addons.length - 1
                    ? "border-0"
                    : "border-b border-black/60"
                }
              >
                <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.6fr)_minmax(0,1.4fr)] items-center gap-2 px-4 py-5 text-center text-sm text-white md:gap-4 md:px-8">
                  <p className="font-normal">{addon.name}</p>
                  <p className="font-normal">{addon.price}</p>
                  <p className="text-white/85">{addon.bestFor}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className={`mt-6 text-center ${PRICING_DISCLAIMER}`}>
          {footnote}
        </p>
        </div>
      </div>
    </section>
  );
}
