import { ADVISORY_PHILOSOPHY } from "./advisoryData";
import { ADVISORY_BODY, ADVISORY_CONTAINER, ADVISORY_EYEBROW, ADVISORY_SECTION, ADVISORY_TITLE } from "./advisoryStyles";

export function AdvisoryPhilosophy() {
  return (
    <section className={`${ADVISORY_SECTION} overflow-hidden grain`}>
      <div className={ADVISORY_CONTAINER}>
        <div className="mx-auto max-w-4xl">
          <div className="mb-9 flex items-center gap-3 sm:mb-12">
            <span className={ADVISORY_EYEBROW}>{ADVISORY_PHILOSOPHY.eyebrow}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <h2 className={ADVISORY_TITLE}>{ADVISORY_PHILOSOPHY.title}</h2>

          <div className="mt-8 space-y-5 sm:mt-10 sm:space-y-6">
            {ADVISORY_PHILOSOPHY.paragraphs.map((paragraph) => (
              <p key={paragraph} className={ADVISORY_BODY}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
