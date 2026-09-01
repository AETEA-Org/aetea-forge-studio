import { Briefcase, Linkedin } from "lucide-react";
import { ADVISORY_ABOUT, ADVISORY_LINKS } from "./advisoryData";
import { AdvisoryBookButton } from "./AdvisoryBookButton";
import { ADVISORY_BODY, ADVISORY_CONTAINER, ADVISORY_EYEBROW, ADVISORY_SECTION, ADVISORY_TITLE } from "./advisoryStyles";

export function AdvisoryAbout() {
  return (
    <section className={ADVISORY_SECTION}>
      <div className={ADVISORY_CONTAINER}>
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-9 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div>
              <div className="mb-6 flex items-center gap-3 sm:mb-8">
                <span className={ADVISORY_EYEBROW}>{ADVISORY_ABOUT.eyebrow}</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <h2 className={ADVISORY_TITLE}>{ADVISORY_ABOUT.jointTitle}</h2>
              <p className={`mt-6 sm:mt-8 ${ADVISORY_BODY}`}>{ADVISORY_ABOUT.jointLead}</p>
              <p className={`mt-5 sm:mt-6 ${ADVISORY_BODY}`}>{ADVISORY_ABOUT.jointBody}</p>
            </div>

            <div className="mx-auto aspect-square w-full max-w-[min(380px,78vw)] overflow-hidden rounded-full">
              <img
                src="/advisory/ash-tal.jpg"
                alt="Ash and Tal, founders of AETEA"
                className="h-full w-full object-cover object-[42%_top]"
              />
            </div>
          </div>

          <div className="mt-10 border-t border-border pt-10 sm:mt-12 sm:pt-12 lg:mt-16 lg:pt-16">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <div>
                <h3 className={ADVISORY_TITLE}>{ADVISORY_ABOUT.ash.name}</h3>
                <div className="mt-5 space-y-4 sm:mt-6 sm:space-y-5">
                  {ADVISORY_ABOUT.ash.bio.map((paragraph) => (
                    <p key={paragraph} className={ADVISORY_BODY}>
                      {paragraph}
                    </p>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-4 sm:mt-8">
                  <a
                    href={ADVISORY_LINKS.ashLinkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Ash on LinkedIn"
                    className="text-foreground/50 transition-colors hover:text-foreground"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a
                    href={ADVISORY_LINKS.ashPortfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Ash’s portfolio"
                    className="text-foreground/50 transition-colors hover:text-foreground"
                  >
                    <Briefcase className="h-5 w-5" />
                  </a>
                </div>
              </div>

              <div>
                <h3 className={ADVISORY_TITLE}>{ADVISORY_ABOUT.tal.name}</h3>
                <div className="mt-5 space-y-4 sm:mt-6 sm:space-y-5">
                  {ADVISORY_ABOUT.tal.bio.map((paragraph) => (
                    <p key={paragraph} className={ADVISORY_BODY}>
                      {paragraph}
                    </p>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-4 sm:mt-8">
                  <a
                    href={ADVISORY_LINKS.talLinkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Tal on LinkedIn"
                    className="text-foreground/50 transition-colors hover:text-foreground"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center text-center sm:mt-16">
            <p className={`max-w-2xl ${ADVISORY_BODY}`}>
              {ADVISORY_ABOUT.closing}
            </p>

            <div className="mt-8 sm:mt-10">
              <AdvisoryBookButton />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
