import { ADVISORY_HOW_WE_WORK } from "./advisoryData";
import { ADVISORY_BODY, ADVISORY_TITLE } from "./advisoryStyles";

export function AdvisoryHowWeWork() {
  return (
    <section className="relative py-28 md:py-36 grain">
      <div className="container px-6 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <h2 className={ADVISORY_TITLE}>{ADVISORY_HOW_WE_WORK.title}</h2>

          <div className="mt-10 space-y-6">
            {ADVISORY_HOW_WE_WORK.paragraphs.map((paragraph) => (
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
