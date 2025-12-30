const services = [
  "Strategy",
  "Branding",
  "Creative Direction",
  "Design Support",
  "Content Systems",
  "Film/Video",
  "Editing",
  "Voiceover",
  "PR/Press",
  "Web",
  "Apps & Games",
  "Email Marketing",
  "Publishing",
  "Music/Lyrics",
  "Data Analytics",
  "Scheduling",
  "Monitoring",
];

export function ServicesGrid() {
  return (
    <section className="py-24 md:py-32 bg-secondary/30">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Services at a Glance
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to create, launch, and grow — all in one place.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
          {services.map((service) => (
            <div
              key={service}
              className="px-5 py-2.5 rounded-full bg-card border border-border text-sm font-medium hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-default"
            >
              {service}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
