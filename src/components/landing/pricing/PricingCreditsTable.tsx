import type { PricingTableRow } from "./pricingData";

type PricingCreditsTableProps = {
  rows: PricingTableRow[];
};

export function PricingCreditsTable({ rows }: PricingCreditsTableProps) {
  return (
    <section className="relative py-16 md:py-24">
      <div className="container px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.35fr] lg:items-start">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Actions vs Credits
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              How credits are utilized by AETEA actions.
            </h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1a]">
            <div className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,0.7fr)_minmax(0,1.6fr)] gap-4 border-b border-black/60 px-5 py-4 text-sm font-bold text-white/70 md:grid md:px-8">
              <span>AETEA actions</span>
              <span>Credits</span>
              <span>What it means</span>
            </div>
            <ul>
              {rows.map((row, index) => (
                <li
                  key={row.action}
                  className={
                    index === rows.length - 1
                      ? "border-0"
                      : "border-b border-black/60"
                  }
                >
                  <div className="grid grid-cols-1 gap-2 px-5 py-5 text-sm text-white md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.7fr)_minmax(0,1.6fr)] md:items-center md:gap-4 md:px-8 md:text-base">
                    <p className="font-bold">
                      <span className="mr-2 text-xs uppercase tracking-wider text-white/40 md:hidden">
                        Action
                      </span>
                      {row.action}
                    </p>
                    <p className="font-bold text-white/95">
                      <span className="mr-2 text-xs uppercase tracking-wider text-white/40 md:hidden">
                        Credits
                      </span>
                      {row.cost}
                    </p>
                    <p className="text-white/85">
                      <span className="mr-2 text-xs uppercase tracking-wider text-white/40 md:hidden">
                        Meaning
                      </span>
                      {row.meaning}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
