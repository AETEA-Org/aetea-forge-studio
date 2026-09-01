import { ADVISORY_AUDIENCE } from "./advisoryData";
import { ADVISORY_BODY, ADVISORY_CONTAINER, ADVISORY_SECTION, ADVISORY_TITLE } from "./advisoryStyles";

export function AdvisoryAudience() {
  return (
    <section className={ADVISORY_SECTION}>
      <div className={ADVISORY_CONTAINER}>
        <div className="mx-auto max-w-4xl">
          <h2 className={ADVISORY_TITLE}>{ADVISORY_AUDIENCE.title}</h2>

          <div className="mt-8 space-y-5 sm:mt-10 sm:space-y-6">
            <p className={ADVISORY_BODY}>{ADVISORY_AUDIENCE.primary}</p>
            <p className={ADVISORY_BODY}>{ADVISORY_AUDIENCE.alsoRelevant}</p>
            <p className={ADVISORY_BODY}>{ADVISORY_AUDIENCE.posture}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
