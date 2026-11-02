import type { PricingTableRow } from "./pricingData";
import {
  PRICING_BODY,
  PRICING_EYEBROW,
  PRICING_SECTION_TITLE,
} from "./pricingStyles";

type PricingCreditsTableProps = {
  rows: PricingTableRow[];
  /** Everything whose cost is not fixed, said once rather than row by row. */
  variableNote?: string;
};

export function PricingCreditsTable({
  rows,
  variableNote,
}: PricingCreditsTableProps) {
  return (
    <section className="relative">
      <div className="mx-auto w-full max-w-[1100px] px-6 xl:px-0">
        <div className="mx-auto grid max-w-[280px] grid-cols-1 gap-10 sm:max-w-[544px] xl:max-w-none xl:grid-cols-[1fr_1.35fr] xl:items-start">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2">
              <p className={`shrink-0 ${PRICING_EYEBROW}`}>
                Actions vs Credits
              </p>
              <div aria-hidden="true" className="h-px min-w-0 flex-1 bg-border" />
            </div>
            <h2 className={`${PRICING_SECTION_TITLE} text-foreground`}>
              What things cost.
            </h2>
            {variableNote && (
              <p className={`mt-5 max-w-xl ${PRICING_BODY} text-muted-foreground`}>
                {variableNote}
              </p>
            )}
          </div>

          <div className="xl:mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1a]">
            <div className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,0.7fr)_minmax(0,1.6fr)] gap-4 border-b border-black/60 px-5 py-4 text-center text-sm font-normal text-white/70 md:grid md:px-8">
              <span>Action</span>
              <span>Credits</span>
              <span>Meaning</span>
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
                  <div className="grid grid-cols-1 gap-2 px-5 py-5 text-center text-sm text-white md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.7fr)_minmax(0,1.6fr)] md:items-center md:gap-4 md:px-8">
                    <p className="font-normal">
                      <span className="mr-2 text-xs uppercase tracking-wider text-white/40 md:hidden">
                        Action
                      </span>
                      {row.action}
                    </p>
                    <p className="font-normal text-white/95">
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
