const steps = [
  {
    number: "01",
    title: "Start with a brief",
    description: "Define your goal, audience, offer, and constraints. Upload existing assets or start fresh.",
  },
  {
    number: "02",
    title: "Get direction",
    description: "Receive angles, concepts, formats, and a clear plan tailored to your objectives.",
  },
  {
    number: "03",
    title: "Create deliverables",
    description: "Production-ready assets across channels — designed, written, and formatted for launch.",
  },
  {
    number: "04",
    title: "Launch & learn",
    description: "Built-in checkpoints for feedback, iteration loops, and continuous improvement.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 md:py-40 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/30 to-transparent" />
      
      <div className="container relative px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-20">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="h-px w-12 bg-border" />
              <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Process
              </span>
              <div className="h-px w-12 bg-border" />
            </div>
            
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Brief to launch in four steps.
            </h2>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Connecting line - desktop */}
            <div className="hidden lg:block absolute top-12 left-0 right-0 h-px bg-border" />
            
            <div className="grid lg:grid-cols-4 gap-12 lg:gap-8">
              {steps.map((step, i) => (
                <div key={step.number} className="relative">
                  {/* Number circle */}
                  <div className="w-24 h-24 rounded-full border border-border flex items-center justify-center mb-8 relative bg-background">
                    <span className="font-display text-2xl font-bold text-primary">{step.number}</span>
                  </div>
                  
                  {/* Mobile connector */}
                  {i < steps.length - 1 && (
                    <div className="lg:hidden absolute left-12 top-24 w-px h-12 bg-border" />
                  )}

                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
