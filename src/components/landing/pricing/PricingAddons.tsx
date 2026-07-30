import type { PricingAddon } from "./pricingData";

type PricingAddonsProps = {
  addons: PricingAddon[];
  footnote: string;
};

export function PricingAddons({ addons, footnote }: PricingAddonsProps) {
  return (
    <section className="relative py-16 md:py-24">
      <div className="container px-6 lg:px-12">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-4 flex w-full max-w-xl items-center gap-4">
            <div className="h-px flex-1 bg-white/30" />
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Add-ons
            </p>
            <div className="h-px flex-1 bg-white/30" />
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Extra credits and users
          </h2>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1a]">
          <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,0.6fr)_minmax(0,1.4fr)] gap-4 border-b border-black/60 px-5 py-4 text-sm font-bold text-white/70 md:grid md:px-8">
            <span>Add-ons</span>
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
                <div className="grid grid-cols-1 gap-2 px-5 py-5 text-sm text-white md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.6fr)_minmax(0,1.4fr)] md:items-center md:gap-4 md:px-8 md:text-base">
                  <p className="font-bold">{addon.name}</p>
                  <p className="font-bold">{addon.price}</p>
                  <p className="text-white/85">{addon.bestFor}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 max-w-3xl text-sm text-muted-foreground md:text-base">
          {footnote}
        </p>
      </div>
    </section>
  );
}
