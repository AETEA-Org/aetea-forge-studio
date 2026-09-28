import { cn } from "@/lib/utils";
import { LANDING_SECTION_STANDARD } from "./landingStyles";

type Service = {
  label: string;
  comingSoon?: boolean;
};

const services: readonly Service[] = [
  { label: "Research" },
  { label: "Strategy" },
  { label: "Branding" },
  { label: "Creative Direction" },
  { label: "Design" },
  { label: "Content Systems" },
  { label: "Images" },
  { label: "Film & Video" },
  { label: "Editing" },
  { label: "Voiceover" },
  { label: "PR & Press" },
  { label: "Web" },
  { label: "Apps & Games", comingSoon: true },
  { label: "Email Marketing" },
  { label: "Articles" },
  { label: "Print" },
  { label: "Digital & Social Media" },
  { label: "Publishing", comingSoon: true },
  { label: "Music & Lyrics" },
  { label: "Analytics", comingSoon: true },
  { label: "Scheduling", comingSoon: true },
];

export function ServicesGrid() {
  return (
    <section className={`${LANDING_SECTION_STANDARD} relative overflow-hidden`}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/30 to-transparent" />
      
      <div className="container relative px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-16">
            <span className="text-xs uppercase tracking-[0.3em] text-foreground/60">
              Capabilities
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] text-foreground">
                Everything you need, in one place.
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
              {services.map(({ label, comingSoon }) => (
                <span
                  key={label}
                  aria-disabled={comingSoon || undefined}
                  aria-label={comingSoon ? `${label} — coming soon` : undefined}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm cursor-default",
                    comingSoon
                      ? "border-foreground/10 text-foreground/30"
                      : "border-border text-foreground/65 transition-colors hover:border-foreground/30 hover:text-foreground",
                  )}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
