import { ADVISORY_AUDIENCE } from "./advisoryData";
import { ADVISORY_BODY, ADVISORY_TITLE } from "./advisoryStyles";

export function AdvisoryAudience() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="container px-6 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <h2 className={ADVISORY_TITLE}>{ADVISORY_AUDIENCE.title}</h2>

          <div className="mt-10 space-y-6">
            <p className={ADVISORY_BODY}>{ADVISORY_AUDIENCE.primary}</p>
            <p className={ADVISORY_BODY}>{ADVISORY_AUDIENCE.alsoRelevant}</p>
            <p className={ADVISORY_BODY}>{ADVISORY_AUDIENCE.posture}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
