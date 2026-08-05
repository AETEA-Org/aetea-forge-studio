import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ADVISORY_BOOK_CTA, ADVISORY_CALENDLY_URL } from "./advisoryData";

export function AdvisoryBookCta() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32 grain">
      <div className="absolute inset-0 bg-black" />
      <div className="absolute top-1/2 left-1/2 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[180px] animate-glow-pulse" />

      <div className="container relative z-10 px-6 lg:px-12">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <img
            src="/advisory/mark.png"
            alt=""
            className="mb-8 h-14 w-14 object-contain opacity-90 sm:h-16 sm:w-16"
            aria-hidden
          />
          <p className="mb-10 max-w-xl text-base leading-[1.75] text-foreground/70 sm:text-lg">
            {ADVISORY_BOOK_CTA.supporting}
          </p>
          <Button
            asChild
            size="lg"
            className="group h-14 rounded-full bg-foreground px-8 text-base text-background hover:bg-foreground/90"
          >
            <a
              href={ADVISORY_CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {ADVISORY_BOOK_CTA.label}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
