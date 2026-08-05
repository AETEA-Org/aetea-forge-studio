import { ArrowRight } from "lucide-react";
import {
  ADVISORY_ABOUT,
  ADVISORY_BOOK_CTA,
  ADVISORY_CALENDLY_URL,
  ADVISORY_LINKS,
} from "./advisoryData";

export function AdvisoryAbout() {
  return (
    <section className="relative py-28 md:py-36">
      <div className="container px-6 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center gap-3">
            <span className="text-xs uppercase tracking-[0.3em] text-foreground/60">
              {ADVISORY_ABOUT.eyebrow}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Joint Ash Tal descriptor + shared photo */}
          <div className="grid items-start gap-10 lg:grid-cols-5 lg:gap-14">
            <div className="lg:col-span-3">
              <img
                src="/advisory/logo-blue.png"
                alt=""
                className="mb-8 h-14 w-14 object-contain sm:h-16 sm:w-16"
                aria-hidden
              />
              <h2 className="font-display text-3xl font-bold tracking-tight leading-[1.15] text-foreground sm:text-4xl md:text-5xl">
                {ADVISORY_ABOUT.jointTitle}
              </h2>
              <p className="mt-6 text-lg leading-[1.75] text-foreground/80 sm:text-xl">
                {ADVISORY_ABOUT.jointLead}
              </p>
              <p className="mt-6 text-base leading-[1.75] text-foreground/70 sm:text-lg">
                {ADVISORY_ABOUT.jointBody}
              </p>
            </div>

            <div className="lg:col-span-2">
              <div className="overflow-hidden rounded-2xl border border-border/50">
                <img
                  src="/advisory/ash-tal.jpg"
                  alt="Ash and Tal, founders of AETEA"
                  className="aspect-[4/5] max-h-[420px] w-full object-cover object-top"
                />
              </div>
            </div>
          </div>

          {/* Individual descriptors */}
          <div className="mt-20 grid gap-14 md:grid-cols-2 md:gap-12">
            <div>
              <h3 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {ADVISORY_ABOUT.ash.name}
              </h3>
              <div className="mt-6 space-y-5">
                {ADVISORY_ABOUT.ash.bio.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-base leading-[1.75] text-foreground/70"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
              <p className="mt-8 text-sm text-foreground/60">
                <a
                  href={ADVISORY_LINKS.ashLinkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 transition-colors hover:text-foreground"
                >
                  Ash on LinkedIn
                </a>
                <span className="mx-2 text-foreground/30">·</span>
                <a
                  href={ADVISORY_LINKS.ashPortfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 transition-colors hover:text-foreground"
                >
                  Ash’s portfolio
                </a>
              </p>
            </div>

            <div>
              <h3 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {ADVISORY_ABOUT.tal.name}
              </h3>
              <div className="mt-6 space-y-5">
                {ADVISORY_ABOUT.tal.bio.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-base leading-[1.75] text-foreground/70"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
              <p className="mt-8 text-sm text-foreground/60">
                <a
                  href={ADVISORY_LINKS.talLinkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 transition-colors hover:text-foreground"
                >
                  Tal on LinkedIn
                </a>
              </p>
            </div>
          </div>

          <p className="mt-16 max-w-3xl text-base leading-[1.75] text-foreground/70 sm:text-lg">
            {ADVISORY_ABOUT.closing}
          </p>

          <p className="mt-8">
            <a
              href={ADVISORY_CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 text-sm text-foreground/70 underline underline-offset-4 transition-colors hover:text-foreground"
            >
              {ADVISORY_BOOK_CTA.label}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
