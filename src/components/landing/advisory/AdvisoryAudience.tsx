import { ADVISORY_AUDIENCE } from "./advisoryData";

export function AdvisoryAudience() {
  return (
    <section className="relative py-28 md:py-36">
      <div className="container px-6 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-3xl font-bold tracking-tight leading-[1.15] text-foreground sm:text-4xl md:text-5xl">
            {ADVISORY_AUDIENCE.title}
          </h2>

          <div className="mt-10 space-y-6">
            <p className="text-lg leading-[1.75] text-foreground/80 sm:text-xl">
              {ADVISORY_AUDIENCE.primary}
            </p>
            <p className="text-base leading-[1.75] text-foreground/70 sm:text-lg">
              {ADVISORY_AUDIENCE.alsoRelevant}
            </p>
            <p className="text-base leading-[1.75] text-foreground/60 sm:text-lg">
              {ADVISORY_AUDIENCE.posture}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
