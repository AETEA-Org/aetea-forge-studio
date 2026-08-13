import { AdvisoryBookButton } from "./AdvisoryBookButton";

/** Compact sticky booking bar for small screens after the hero CTA scrolls away. */
export function AdvisoryMobileStickyCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/90 p-3 backdrop-blur-md md:hidden">
      <AdvisoryBookButton className="h-12 w-full hover:scale-100" />
    </div>
  );
}
