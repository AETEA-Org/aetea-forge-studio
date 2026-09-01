import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ADVISORY_BOOK_CTA, ADVISORY_BOOKING_URL } from "./advisoryData";

type AdvisoryBookButtonProps = {
  className?: string;
};

export function AdvisoryBookButton({ className }: AdvisoryBookButtonProps) {
  return (
    <Button
      asChild
      size="lg"
      className={cn(
        "group h-12 max-w-full rounded-full bg-foreground px-5 text-sm text-background transition-all duration-300 hover:bg-foreground/90 hover:scale-105 sm:h-14 sm:px-8 sm:text-base",
        className,
      )}
    >
      <a
        href={ADVISORY_BOOKING_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        {ADVISORY_BOOK_CTA.label}
        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
      </a>
    </Button>
  );
}
