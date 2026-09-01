import { ADVISORY_HERO } from "./advisoryData";
import { AdvisoryBookButton } from "./AdvisoryBookButton";

export function AdvisoryHero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-black">
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-background" />
      <div className="absolute left-1/2 top-28 h-[420px] w-[760px] max-w-[90vw] -translate-x-1/2 rounded-full bg-primary/10 blur-[170px]" />

      <div className="container relative z-10 flex justify-center px-6 pb-20 pt-24 md:pb-24 md:pt-20 lg:px-12">
        <div className="flex w-full max-w-[960px] flex-col items-center text-center">
          <div
            className="mb-0 flex w-full justify-center opacity-0 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            <img
              src="/advisory/the-80-ones-wordmark.png"
              alt={ADVISORY_HERO.title}
              className="h-auto w-full max-w-[960px] object-contain"
              style={{ aspectRatio: "2019 / 921" }}
            />
          </div>

          <h1
            className="-mt-8 mb-14 font-display text-4xl font-bold tracking-tight leading-none text-foreground opacity-0 animate-fade-in md:-mt-16 md:mb-16 md:text-5xl"
            style={{ animationDelay: "0.2s" }}
          >
            {ADVISORY_HERO.wisdomTagline}
          </h1>

          <div
            className="flex w-full max-w-xl items-center gap-3 opacity-0 animate-fade-in sm:gap-5"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="h-px min-w-8 flex-1 bg-foreground/30" />
            <p className="shrink-0 text-center text-base font-normal leading-none text-foreground/75 md:text-xl">
              {ADVISORY_HERO.tagline}
            </p>
            <div className="h-px min-w-8 flex-1 bg-foreground/30" />
          </div>

          <div
            className="mx-auto mt-9 w-full max-w-[830px] text-left opacity-0 animate-fade-in md:columns-2 md:gap-10"
            style={{ animationDelay: "0.4s" }}
          >
            <p className="mb-4 break-inside-avoid text-sm leading-relaxed text-foreground/65 md:text-base">{ADVISORY_HERO.subscriptionNote}</p>
            <p className="mb-4 text-sm leading-relaxed text-foreground/65 md:text-base">{ADVISORY_HERO.distinction}</p>
            <p className="mb-4 text-sm leading-relaxed text-foreground/65 md:text-base">{ADVISORY_HERO.uncertainty}</p>
            <p className="mb-0 break-inside-avoid text-sm leading-relaxed text-foreground/65 md:text-base">{ADVISORY_HERO.closing}</p>
          </div>

          <div
            className="mt-9 flex justify-center opacity-0 animate-fade-in md:mt-10"
            style={{ animationDelay: "0.6s" }}
          >
            <AdvisoryBookButton />
          </div>
        </div>
      </div>

    </section>
  );
}
