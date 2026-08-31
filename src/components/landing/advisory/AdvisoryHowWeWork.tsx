import { ADVISORY_HOW_WE_WORK } from "./advisoryData";
import { ADVISORY_BODY, ADVISORY_TITLE } from "./advisoryStyles";

export function AdvisoryHowWeWork() {
  return (
    <section className="relative py-20 md:py-28 grain">
      <div className="container px-6 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <h2 className={ADVISORY_TITLE}>{ADVISORY_HOW_WE_WORK.title}</h2>

          <div className="mt-10 space-y-6">
            {ADVISORY_HOW_WE_WORK.intro.map((paragraph) => (
              <p key={paragraph} className={ADVISORY_BODY}>
                {paragraph}
              </p>
            ))}
          </div>

          <blockquote className="mt-10 space-y-6 border-l-2 border-foreground/20 pl-6 md:pl-8">
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
