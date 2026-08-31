import { ADVISORY_BOUNDARIES } from "./advisoryData";
import { ADVISORY_BODY, ADVISORY_TITLE } from "./advisoryStyles";

export function AdvisoryBoundaries() {
  return (
    <section className="relative py-20 md:py-28 grain">
      <div className="container px-6 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <h2 className={ADVISORY_TITLE}>{ADVISORY_BOUNDARIES.title}</h2>

          <div className="mt-10 space-y-6">
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
