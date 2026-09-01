import { ADVISORY_BOUNDARIES } from "./advisoryData";
import { ADVISORY_BODY, ADVISORY_CONTAINER, ADVISORY_SECTION, ADVISORY_TITLE } from "./advisoryStyles";

export function AdvisoryBoundaries() {
  return (
    <section className={`${ADVISORY_SECTION} grain`}>
      <div className={ADVISORY_CONTAINER}>
        <div className="mx-auto max-w-4xl">
          <h2 className={ADVISORY_TITLE}>{ADVISORY_BOUNDARIES.title}</h2>

          <div className="mt-8 space-y-5 sm:mt-10 sm:space-y-6">
            <p className={ADVISORY_BODY}>{ADVISORY_BOUNDARIES.not}</p>
            <p className={ADVISORY_BODY}>{ADVISORY_BOUNDARIES.credentials}</p>
            <p className={ADVISORY_BODY}>{ADVISORY_BOUNDARIES.subscription}</p>
            <p className={ADVISORY_BODY}>{ADVISORY_BOUNDARIES.followThrough}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
