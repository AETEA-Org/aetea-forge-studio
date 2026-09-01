import { ADVISORY_CLARIFIES } from "./advisoryData";
import { ADVISORY_BODY, ADVISORY_CONTAINER, ADVISORY_SECTION, ADVISORY_TITLE } from "./advisoryStyles";

export function AdvisoryClarifies() {
  return (
    <section className={ADVISORY_SECTION}>
      <div className={ADVISORY_CONTAINER}>
        <div className="mx-auto max-w-4xl">
          <h2 className={ADVISORY_TITLE}>{ADVISORY_CLARIFIES.title}</h2>

          <p className={`mt-6 sm:mt-8 ${ADVISORY_BODY}`}>{ADVISORY_CLARIFIES.lead}</p>

          <ol className="mt-9 space-y-4 sm:mt-12 sm:space-y-5">
            {ADVISORY_CLARIFIES.items.map((item, index) => (
              <li key={item} className="flex gap-3 sm:gap-5">
                <span className="shrink-0 pt-1.5 font-mono text-xs text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={ADVISORY_BODY}>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
