import { ADVISORY_HERO } from "./advisoryData";
import { AdvisoryBookButton } from "./AdvisoryBookButton";
import { ADVISORY_BODY, ADVISORY_TITLE } from "./advisoryStyles";

export function AdvisoryHero() {
  return (
    <section className="relative flex min-h-[100vh] items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-background" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(220 100% 60% / 0.3) 1px, transparent 1px),
                            linear-gradient(90deg, hsl(220 100% 60% / 0.3) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute top-1/3 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[180px] animate-glow-pulse" />
      <div
        className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[150px] animate-glow-pulse"
        style={{ animationDelay: "1.5s" }}
      />

      <div className="container relative z-10 flex justify-center px-6 py-32 lg:px-12 md:py-40">
        <div className="flex w-[900px] max-w-full flex-col items-center text-center">
          <div
            className="mb-6 flex w-full justify-center opacity-0 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            <img
              src="/advisory/the-80-ones-wordmark.png"
              alt={ADVISORY_HERO.title}
              className="h-auto w-full max-w-[820px] object-contain"
              style={{ aspectRatio: "2019 / 921" }}
            />
          </div>

          <h1
            className={`mb-8 opacity-0 animate-fade-in ${ADVISORY_TITLE}`}
            style={{ animationDelay: "0.2s" }}
          >
            {ADVISORY_HERO.wisdomTagline}
          </h1>

          <div
            className="flex w-full max-w-3xl items-center gap-3 opacity-0 animate-fade-in sm:gap-5"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="h-px min-w-8 flex-1 bg-foreground/30" />
            <p className={`shrink-0 text-center ${ADVISORY_TITLE}`}>
              {ADVISORY_HERO.tagline}
            </p>
            <div className="h-px min-w-8 flex-1 bg-foreground/30" />
          </div>

          <div
            className="mx-auto mt-10 grid w-full max-w-5xl gap-8 text-left opacity-0 animate-fade-in md:grid-cols-2 md:gap-12"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="space-y-4">
              <p className={ADVISORY_BODY}>{ADVISORY_HERO.subscriptionNote}</p>
              <p className={ADVISORY_BODY}>{ADVISORY_HERO.distinction}</p>
            </div>
            <div className="space-y-4">
              <p className={ADVISORY_BODY}>{ADVISORY_HERO.uncertainty}</p>
              <p className={ADVISORY_BODY}>{ADVISORY_HERO.closing}</p>
            </div>
          </div>

          <div
            className="mt-10 flex justify-center opacity-0 animate-fade-in md:mt-12"
            style={{ animationDelay: "0.6s" }}
          >
            <AdvisoryBookButton />
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-0 animate-fade-in"
        style={{ animationDelay: "1.2s" }}
      >
        <div className="flex h-10 w-6 items-start justify-center rounded-full border border-foreground/20 p-2">
          <div className="h-2 w-1 rounded-full bg-foreground/40 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
