import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ADVISORY_BOOK_CTA, ADVISORY_CALENDLY_URL } from "./advisoryData";

/** Compact sticky booking bar for small screens after the hero CTA scrolls away. */
export function AdvisoryMobileStickyCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/90 p-3 backdrop-blur-md md:hidden">
      <Button
        asChild
        size="lg"
        className="group h-12 w-full rounded-full bg-foreground text-base text-background hover:bg-foreground/90"
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
  );
}
