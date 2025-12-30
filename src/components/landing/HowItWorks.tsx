import { Link } from "react-router-dom";
import { ArrowRight, FileText, Compass, Package, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Start with a brief",
    description: "Define your goal, audience, offer, and constraints. Upload existing assets or start fresh.",
  },
  {
    number: "02",
    icon: Compass,
    title: "Get direction",
    description: "Receive angles, concepts, formats, and a clear plan tailored to your objectives.",
  },
  {
    number: "03",
    icon: Package,
    title: "Create deliverables",
    description: "Production-ready assets across channels — designed, written, and formatted for launch.",
  },
  {
    number: "04",
    icon: Rocket,
    title: "Launch & learn",
    description: "Built-in checkpoints for feedback, iteration loops, and continuous improvement.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 md:py-40 relative overflow-hidden grain">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container relative px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-20">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-border" />
              <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Process
              </span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-border" />
            </div>
            
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Brief to launch in four steps.
            </h2>
          </div>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div 
                key={step.number} 
                className="group relative p-8 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm transition-all duration-500 hover:border-primary/30 hover:bg-card/50 hover:shadow-[0_0_40px_hsla(220,100%,60%,0.1)]"
              >
                {/* Step number badge */}
                <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{step.number}</span>
                </div>
                
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 transition-all duration-500 group-hover:bg-primary/20 group-hover:scale-110">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>

                <h3 className="font-display text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
                
                {/* Connector arrow - only on lg screens */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 text-border group-hover:text-primary/40 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <Link to="/auth">
              <Button 
                size="lg"
                className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-8 h-14 text-base group transition-all duration-300 hover:scale-105"
              >
                Start Your First Brief
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}