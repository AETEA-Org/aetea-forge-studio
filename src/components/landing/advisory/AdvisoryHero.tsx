import { ADVISORY_HERO } from "./advisoryData";
import { AdvisoryBookButton } from "./AdvisoryBookButton";

export function AdvisoryHero() {
  return (
    <section className="relative overflow-hidden bg-black">
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-background" />
      <div className="absolute left-1/2 top-24 h-[clamp(220px,38vw,420px)] w-[min(700px,88vw)] -translate-x-1/2 rounded-full bg-primary/10 blur-[clamp(90px,14vw,170px)] sm:top-28" />

      <div className="container relative flex justify-center px-5 pb-6 pt-24 sm:px-6 sm:pb-8 lg:px-12 lg:pb-10 lg:pt-20">
        <div className="flex w-full max-w-[960px] flex-col items-center text-center">
          <div
            className="mb-0 flex w-full justify-center opacity-0 mix-blend-screen animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            <img
              src="/advisory/the-80-ones-advisory-logo.png"
              alt="The 80 Ones Advisory logo"
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
            className="grid w-full max-w-xl grid-cols-[minmax(0.375rem,1fr)_auto_minmax(0.375rem,1fr)] items-center gap-1 opacity-0 animate-fade-in sm:grid-cols-[minmax(1.5rem,1fr)_auto_minmax(1.5rem,1fr)] sm:gap-4 lg:gap-5"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="h-px w-full bg-border" />
            <p className="whitespace-nowrap pl-[0.18em] text-center text-[0.68rem] uppercase tracking-[0.18em] text-foreground/60 sm:pl-[0.3em] sm:text-xs sm:tracking-[0.3em]">
              {ADVISORY_HERO.tagline}
            </p>
            <div className="h-px w-full bg-border" />
          </div>

          <div
            className="mx-auto mt-8 w-full max-w-[830px] text-left opacity-0 animate-fade-in sm:mt-9 lg:mt-8 lg:columns-2 lg:gap-10"
            style={{ animationDelay: "0.4s" }}
          >
            <p className="mb-4 break-inside-avoid text-[0.95rem] leading-relaxed text-foreground/65 sm:text-base lg:text-lg lg:leading-[1.4]">{ADVISORY_HERO.subscriptionNote}</p>
            <p className="mb-4 text-[0.95rem] leading-relaxed text-foreground/65 sm:text-base lg:text-lg lg:leading-[1.4]">{ADVISORY_HERO.distinction}</p>
            {ADVISORY_HERO.uncertainty.map((paragraph) => (
              <p key={paragraph} className="mb-4 text-[0.95rem] leading-relaxed text-foreground/65 sm:text-base lg:text-lg lg:leading-[1.4]">{paragraph}</p>
            ))}
            <p className="mb-0 break-inside-avoid text-[0.95rem] leading-relaxed text-foreground/65 sm:text-base lg:text-lg lg:leading-[1.4]">{ADVISORY_HERO.closing}</p>
          </div>

          <div
            className="relative top-6 mt-8 flex w-full justify-center opacity-0 animate-fade-in sm:top-7 sm:mt-10 lg:top-9"
            style={{ animationDelay: "0.6s" }}
          >
            <AdvisoryBookButton />
          </div>
        </div>
      </div>

    </section>
  );
}
