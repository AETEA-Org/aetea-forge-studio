import { ADVISORY_CLARIFIES } from "./advisoryData";

export function AdvisoryClarifies() {
  return (
    <section className="relative py-28 md:py-36">
      <div className="container px-6 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-3xl font-bold tracking-tight leading-[1.15] text-foreground sm:text-4xl md:text-5xl">
            {ADVISORY_CLARIFIES.title}
          </h2>

          <ol className="mt-12 space-y-5">
            {ADVISORY_CLARIFIES.items.map((item, index) => (
              <li key={item} className="flex gap-5">
                <span className="shrink-0 pt-1.5 font-mono text-xs text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-base leading-[1.75] text-foreground/75 sm:text-lg">
                  {item}
                </span>
              </li>
            ))}
          </ol>

          <p className="mt-12 text-base leading-[1.75] text-foreground/70 sm:text-lg">
            {ADVISORY_CLARIFIES.closing}
          </p>
        </div>
      </div>
    </section>
  );
}
