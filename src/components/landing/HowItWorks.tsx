import { FileText, Lightbulb, Package, RotateCcw } from "lucide-react";

const steps = [
  {
    icon: FileText,
    number: "01",
    title: "Start with a brief",
    description: "Define your goal, audience, offer, and constraints. Upload existing assets or start fresh.",
  },
  {
    icon: Lightbulb,
    number: "02",
    title: "Get direction + options",
    description: "Receive angles, concepts, formats, and a clear plan tailored to your objectives.",
  },
  {
    icon: Package,
    number: "03",
    title: "Create deliverables",
    description: "Production-ready assets across channels — designed, written, and formatted for launch.",
  },
  {
    icon: RotateCcw,
    number: "04",
    title: "Review → Launch → Learn",
    description: "Built-in checkpoints for feedback, iteration loops, and continuous improvement.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-secondary/30">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From brief to launch in four structured steps.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Desktop: Horizontal timeline */}
          <div className="hidden lg:grid lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="absolute top-8 left-[60%] w-full h-px bg-border" />
                )}
                
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                    <step.icon className="h-7 w-7 text-primary" />
                  </div>
                  <span className="text-xs font-mono text-primary mb-2 block">{step.number}</span>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile/Tablet: Vertical timeline */}
          <div className="lg:hidden space-y-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex gap-6">
                <div className="relative flex flex-col items-center">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-px h-full bg-border mt-4" />
                  )}
                </div>
                <div className="pb-8">
                  <span className="text-xs font-mono text-primary mb-1 block">{step.number}</span>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
