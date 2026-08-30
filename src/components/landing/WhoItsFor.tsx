const audiences = [
  {
    label: "SMBs",
    title: "Small and medium businesses",
    description: "Keep brand and marketing work moving without piecing together separate tools, specialists, and handoffs.",
  },
  {
    label: "Founders",
    title: "Entrepreneurs and venture builders",
    description: "Turn an idea, offer, or launch into clear positioning, campaigns, and assets faster, without sacrificing quality or consistency.",
  },
  {
    label: "Agencies",
    title: "Creative and marketing pros",
    description: "Keep research, strategy, creative, deployment, and analysis connected as briefs, contributors, and deadlines multiply. Increase output and reduce workflow chaos without burning out your team.",
  },
  {
    label: "Freelancers",
    title: "Independent creatives and marketers",
    description: "When a brief reaches beyond your core role, work across research, strategy, production, formats, and channels without losing your point of view.",
  },
];

export function WhoItsFor() {
  return (
    <section id="who-its-for" className="py-28 md:py-36 relative grain">
      <div className="container px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="max-w-2xl mb-16 md:mb-20">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-xs uppercase tracking-[0.3em] text-foreground/60">
                Who it’s for
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.15] text-foreground">
              For people turning goals, ideas, and briefs into market-facing work.
            </h2>
          </div>

          {/* Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {audiences.map((audience, i) => (
              <div
                key={audience.label}
                className="group flex h-full flex-col p-6 rounded-2xl border border-border hover:border-muted-foreground/30 transition-all duration-500 hover:glow-sm"
              >
                <span className="text-xs font-mono text-primary mb-6 block">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-xs uppercase tracking-[0.2em] text-foreground/60 mb-3 block">
                  {audience.label}
                </span>
                <h3 className="text-lg font-semibold mb-4 text-foreground">{audience.title}</h3>
                <p className="text-sm text-foreground/65 leading-relaxed mt-auto">
                  {audience.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
