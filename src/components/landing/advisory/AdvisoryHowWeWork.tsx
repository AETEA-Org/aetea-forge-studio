import { ADVISORY_HOW_WE_WORK } from "./advisoryData";

export function AdvisoryHowWeWork() {
  return (
    <section className="relative py-28 md:py-36 grain">
      <div className="container px-6 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-3xl font-bold tracking-tight leading-[1.15] text-foreground sm:text-4xl md:text-5xl">
            {ADVISORY_HOW_WE_WORK.title}
          </h2>

          <div className="mt-10 space-y-6">
            {ADVISORY_HOW_WE_WORK.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="text-base leading-[1.75] text-foreground/70 sm:text-lg"
              >
                {paragraph}
              </p>
            ))}
          </div>

          <blockquote className="mt-12 space-y-6 border-l border-border pl-6 md:pl-8">
            <p className="font-display text-xl leading-[1.5] text-foreground sm:text-2xl">
              {ADVISORY_HOW_WE_WORK.highlight}
            </p>
            <p className="text-base leading-[1.75] text-foreground/70 sm:text-lg">
              {ADVISORY_HOW_WE_WORK.purpose}
            </p>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
