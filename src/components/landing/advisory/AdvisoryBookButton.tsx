import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ADVISORY_BOOK_CTA, ADVISORY_CALENDLY_URL } from "./advisoryData";

type AdvisoryBookButtonProps = {
  className?: string;
};

export function AdvisoryBookButton({ className }: AdvisoryBookButtonProps) {
  return (
    <Button
      asChild
      size="lg"
      className={cn(
        "group h-14 rounded-full bg-foreground px-8 text-base text-background transition-all duration-300 hover:bg-foreground/90 hover:scale-105",
        className,
      )}
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
  );
}
