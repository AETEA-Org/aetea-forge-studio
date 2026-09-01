import { ADVISORY_HOW_WE_WORK } from "./advisoryData";
import { ADVISORY_BODY, ADVISORY_CONTAINER, ADVISORY_SECTION, ADVISORY_TITLE } from "./advisoryStyles";

export function AdvisoryHowWeWork() {
  return (
    <section className={`${ADVISORY_SECTION} grain`}>
      <div className={ADVISORY_CONTAINER}>
        <div className="mx-auto max-w-4xl">
          <h2 className={ADVISORY_TITLE}>{ADVISORY_HOW_WE_WORK.title}</h2>

          <div className="mt-8 space-y-5 sm:mt-10 sm:space-y-6">
            {ADVISORY_HOW_WE_WORK.intro.map((paragraph) => (
              <p key={paragraph} className={ADVISORY_BODY}>
                {paragraph}
              </p>
            ))}
          </div>

          <blockquote className="mt-8 space-y-5 border-l-2 border-foreground/20 pl-4 sm:mt-10 sm:space-y-6 sm:pl-6 lg:pl-8">
            {ADVISORY_HOW_WE_WORK.quote.map((paragraph) => (
              <p key={paragraph} className={`${ADVISORY_BODY} text-foreground/60 italic`}>
                {paragraph}
              </p>
            ))}
          </blockquote>
        </div>
      </div>
    </section>
  );
}
