import { ADVISORY_PHILOSOPHY } from "./advisoryData";

export function AdvisoryPhilosophy() {
  return (
    <section className="relative py-28 md:py-36 grain">
      <div className="container px-6 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center gap-3">
            <span className="text-xs uppercase tracking-[0.3em] text-foreground/60">
              {ADVISORY_PHILOSOPHY.eyebrow}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <h2 className="font-display text-3xl font-bold tracking-tight leading-[1.15] text-foreground sm:text-4xl md:text-5xl">
            {ADVISORY_PHILOSOPHY.title}
          </h2>

          <p className="mt-8 text-lg leading-[1.75] text-foreground/80 sm:text-xl">
            {ADVISORY_PHILOSOPHY.lead}
          </p>

          <div className="mt-8 space-y-6">
            <p className="text-base leading-[1.75] text-foreground/70 sm:text-lg">
              {ADVISORY_PHILOSOPHY.body}
            </p>
            <p className="text-base leading-[1.75] text-foreground/60 sm:text-lg">
              {ADVISORY_PHILOSOPHY.signal}
            </p>
          </div>

          <ul className="mt-12 space-y-4 border-l border-border pl-6">
            {ADVISORY_PHILOSOPHY.principles.map((principle) => (
              <li
                key={principle}
                className="font-display text-lg text-foreground/80 sm:text-xl"
              >
                {principle}
              </li>
            ))}
          </ul>

          <p className="mt-12 text-base leading-[1.75] text-foreground/70 sm:text-lg">
            {ADVISORY_PHILOSOPHY.closing}
          </p>
        </div>
      </div>
    </section>
  );
}
