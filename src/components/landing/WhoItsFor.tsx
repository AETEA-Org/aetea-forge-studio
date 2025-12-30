const audiences = [
  {
    label: "SMBs",
    title: "Small Business Owners",
    description: "Get professional output without building a full team. Focus on running your business while AETEA handles creative.",
  },
  {
    label: "Founders",
    title: "Founders & Entrepreneurs",
    description: "Launch premium brands and campaigns fast. Move quickly without sacrificing quality or consistency.",
  },
  {
    label: "Agencies",
    title: "Creative & Marketing Pros",
    description: "Increase output and reduce workflow chaos. Deliver more for clients without burning out your team.",
  },
  {
    label: "Freelancers",
    title: "Independent Creatives",
    description: "Do the work of a team with intelligent support. Align strategy to delivery without endless handoffs.",
  },
];

export function WhoItsFor() {
  return (
    <section id="who-its-for" className="py-32 md:py-40 relative grain">
      <div className="container px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="max-w-2xl mb-20">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-xs uppercase tracking-[0.3em] text-foreground/60">
                Who it's for
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] text-foreground">
              Built for creators who move fast.
            </h2>
          </div>

          {/* Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {audiences.map((audience, i) => (
              <div
                key={audience.label}
                className="group p-6 rounded-2xl border border-border hover:border-muted-foreground/30 transition-all duration-500 hover:glow-sm"
              >
                <span className="text-xs font-mono text-primary mb-6 block">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-xs uppercase tracking-[0.2em] text-foreground/60 mb-3 block">
                  {audience.label}
                </span>
                <h3 className="text-lg font-semibold mb-4 text-foreground">{audience.title}</h3>
                <p className="text-sm text-foreground/65 leading-relaxed">
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
