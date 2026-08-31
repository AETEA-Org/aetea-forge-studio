import { ADVISORY_PHILOSOPHY } from "./advisoryData";
import { ADVISORY_BODY, ADVISORY_EYEBROW, ADVISORY_TITLE } from "./advisoryStyles";

export function AdvisoryPhilosophy() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28 grain">
      <div className="container px-6 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 flex items-center gap-3">
            <span className={ADVISORY_EYEBROW}>{ADVISORY_PHILOSOPHY.eyebrow}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <h2 className={ADVISORY_TITLE}>{ADVISORY_PHILOSOPHY.title}</h2>

          <div className="mt-10 space-y-6">
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
