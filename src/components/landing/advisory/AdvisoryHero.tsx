import { ADVISORY_HERO } from "./advisoryData";
import { AdvisoryBookButton } from "./AdvisoryBookButton";

export function AdvisoryHero() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-black">
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-background" />
      <div className="absolute left-1/2 top-24 h-[clamp(220px,38vw,420px)] w-[min(760px,92vw)] -translate-x-1/2 rounded-full bg-primary/10 blur-[clamp(90px,14vw,170px)] sm:top-28" />

      <div className="container relative z-10 flex justify-center px-5 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-24 lg:px-12 lg:pb-8 lg:pt-20">
        <div className="flex w-full max-w-[960px] flex-col items-center text-center">
          <div
            className="mb-0 flex w-full justify-center opacity-0 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            <img
              src="/advisory/the-80-ones-wordmark.png"
              alt={ADVISORY_HERO.title}
              className="h-auto w-full max-w-[min(960px,96vw)] object-contain"
              style={{ aspectRatio: "2019 / 921" }}
            />
          </div>

          <h1
            className="-mt-4 mb-10 font-display text-[clamp(1.35rem,5.5vw,3rem)] font-bold tracking-tight leading-none text-foreground opacity-0 animate-fade-in sm:-mt-10 sm:mb-12 lg:-mt-16 lg:mb-16 lg:text-[3.25rem] xl:-mt-20 xl:mb-20 xl:text-[3.5rem]"
            style={{ animationDelay: "0.2s" }}
          >
            {ADVISORY_HERO.wisdomTagline}
          </h1>

          <div
            className="flex w-full max-w-xl items-center gap-2 opacity-0 animate-fade-in sm:gap-4 lg:gap-5"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="h-px min-w-0 flex-1 bg-foreground/30" />
            <p className="max-w-[72vw] flex-none text-center text-sm font-normal leading-tight text-foreground/75 sm:text-base lg:text-xl">
              {ADVISORY_HERO.tagline}
            </p>
            <div className="h-px min-w-0 flex-1 bg-foreground/30" />
          </div>

          <div
            className="mx-auto mt-8 w-full max-w-[830px] text-left opacity-0 animate-fade-in sm:mt-9 lg:mt-8 lg:columns-2 lg:gap-10"
            style={{ animationDelay: "0.4s" }}
          >
            <p className="mb-4 break-inside-avoid text-sm leading-relaxed text-foreground/65 sm:text-[0.95rem] lg:text-sm lg:leading-[1.4]">{ADVISORY_HERO.subscriptionNote}</p>
            <p className="mb-4 text-sm leading-relaxed text-foreground/65 sm:text-[0.95rem] lg:text-sm lg:leading-[1.4]">{ADVISORY_HERO.distinction}</p>
            <p className="mb-4 text-sm leading-relaxed text-foreground/65 sm:text-[0.95rem] lg:text-sm lg:leading-[1.4]">{ADVISORY_HERO.uncertainty}</p>
            <p className="mb-0 break-inside-avoid text-sm leading-relaxed text-foreground/65 sm:text-[0.95rem] lg:text-sm lg:leading-[1.4]">{ADVISORY_HERO.closing}</p>
          </div>

          <div
            className="mt-8 flex w-full justify-center opacity-0 animate-fade-in sm:mt-9 lg:mt-6"
            style={{ animationDelay: "0.6s" }}
          >
            <AdvisoryBookButton />
          </div>
        </div>
      </div>

    </section>
  );
}
