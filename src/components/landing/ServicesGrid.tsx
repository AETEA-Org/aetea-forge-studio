const services = [
  "Strategy",
  "Branding",
  "Creative Direction",
  "Design",
  "Content Systems",
  "Film & Video",
  "Editing",
  "Voiceover",
  "PR & Press",
  "Web",
  "Apps & Games",
  "Email Marketing",
  "Publishing",
  "Music & Lyrics",
  "Analytics",
  "Scheduling",
];

export function ServicesGrid() {
  return (
    <section className="py-32 md:py-40 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/30 to-transparent" />
      
      <div className="container relative px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-16">
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Services
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">
                Everything you need, in one place.
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
              {services.map((service) => (
                <span
                  key={service}
                  className="px-4 py-2 rounded-full text-sm border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors cursor-default"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
