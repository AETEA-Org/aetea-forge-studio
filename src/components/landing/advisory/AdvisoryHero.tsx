import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ADVISORY_BOOK_CTA,
  ADVISORY_CALENDLY_URL,
  ADVISORY_HERO,
} from "./advisoryData";

export function AdvisoryHero() {
  return (
    <>
      <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-20">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-background" />
        <div className="absolute top-1/3 left-1/4 h-[400px] w-[400px] rounded-full bg-primary/15 blur-[180px] animate-glow-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 h-[320px] w-[320px] rounded-full bg-primary/10 blur-[150px] animate-glow-pulse"
          style={{ animationDelay: "1.5s" }}
        />

        <div className="container relative z-10 px-6 lg:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <div
              className="mb-10 flex justify-center opacity-0 animate-fade-in md:mb-12"
              style={{ animationDelay: "0.1s" }}
            >
              <img
                src="/advisory/logo-white.png"
                alt="Ash Tal Advisory"
                className="h-20 w-20 object-contain sm:h-24 sm:w-24 md:h-28 md:w-28"
              />
            </div>

            <h1
              className="font-display text-4xl font-bold tracking-tight text-white opacity-0 animate-fade-in sm:text-5xl md:text-6xl lg:text-7xl"
              style={{ animationDelay: "0.2s" }}
            >
              {ADVISORY_HERO.title}
            </h1>
            <p
              className="mt-4 font-display text-xl text-white/60 opacity-0 animate-fade-in sm:text-2xl md:text-3xl"
              style={{ animationDelay: "0.3s" }}
            >
              {ADVISORY_HERO.tagline}
            </p>

            <div
              className="mx-auto mt-10 max-w-2xl space-y-5 opacity-0 animate-fade-in md:mt-12"
              style={{ animationDelay: "0.4s" }}
            >
              <p className="text-base leading-[1.75] text-foreground/70 sm:text-lg">
                {ADVISORY_HERO.subscriptionNote}
              </p>
              <p className="text-base leading-[1.75] text-foreground/70 sm:text-lg">
                {ADVISORY_HERO.distinction}
              </p>
            </div>

            <div
              className="mt-10 flex justify-center opacity-0 animate-fade-in md:mt-12"
              style={{ animationDelay: "0.55s" }}
            >
              <Button
                asChild
                size="lg"
                className="group h-14 rounded-full bg-foreground px-8 text-base text-background hover:bg-foreground/90"
              >
                <a
                  href={ADVISORY_CALENDLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {ADVISORY_BOOK_CTA.label}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="relative pb-16 md:pb-24">
        <div className="container px-6 lg:px-12">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <p className="text-base leading-[1.75] text-foreground/60 sm:text-lg">
              {ADVISORY_HERO.uncertainty}
            </p>
            <p className="text-base font-medium leading-[1.75] text-foreground/80 sm:text-lg">
              {ADVISORY_HERO.closing}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
