import { Check } from "lucide-react";

const trustPoints = [
  "AI-assisted, human-checked workflows",
  "Clear review points at every stage",
  "Voice, visual, and message consistency",
  "Built to reduce chaos and rework",
];

export function TrustSafety() {
  return (
    <section className="py-32 md:py-40 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/30 to-transparent" />
      
      <div className="container relative px-6 lg:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-12 bg-border" />
            <span className="text-xs uppercase tracking-[0.3em] text-foreground/60">
              Trust
            </span>
            <div className="h-px w-12 bg-border" />
          </div>
          
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-12 text-foreground">
            Quality controls built in.
          </h2>

          <div className="inline-flex flex-col items-start text-left">
            {trustPoints.map((point, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <div className="w-5 h-5 rounded-full border border-primary/50 flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <span className="text-lg text-foreground/80">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
