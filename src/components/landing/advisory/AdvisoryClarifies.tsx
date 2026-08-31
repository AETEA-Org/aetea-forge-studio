import { ADVISORY_CLARIFIES } from "./advisoryData";
import { ADVISORY_BODY, ADVISORY_TITLE } from "./advisoryStyles";

export function AdvisoryClarifies() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="container px-6 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <h2 className={ADVISORY_TITLE}>{ADVISORY_CLARIFIES.title}</h2>

          <p className={`mt-8 ${ADVISORY_BODY}`}>{ADVISORY_CLARIFIES.lead}</p>

          <ol className="mt-12 space-y-5">
            {ADVISORY_CLARIFIES.items.map((item, index) => (
              <li key={item} className="flex gap-5">
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
