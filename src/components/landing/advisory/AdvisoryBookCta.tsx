import { ADVISORY_BOOK_CTA } from "./advisoryData";
import { AdvisoryBookButton } from "./AdvisoryBookButton";
import { ADVISORY_BODY } from "./advisoryStyles";

export function AdvisoryBookCta() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32 grain">
      <div className="absolute inset-0 bg-black" />
      <div className="absolute top-1/2 left-1/2 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[180px] animate-glow-pulse" />

      <div className="container relative z-10 px-6 lg:px-12">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <p className={`mb-12 max-w-xl ${ADVISORY_BODY}`}>
            {ADVISORY_BOOK_CTA.supporting}
          </p>
          <AdvisoryBookButton />
        </div>
      </div>
    </section>
  );
}
