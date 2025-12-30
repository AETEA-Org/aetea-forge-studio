import { CheckCircle2 } from "lucide-react";

const trustPoints = [
  "AI-assisted, human-checked workflows for key outputs",
  "Clear review points (direction → drafts → final)",
  "Designed for consistency: voice, visuals, message alignment",
  "Built to reduce version chaos and rework",
];

export function TrustSafety() {
  return (
    <section className="py-24 md:py-32 bg-secondary/30">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Trust & Safety
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Quality controls built into every step.
          </p>

          <div className="bg-card rounded-2xl p-8 border border-border inline-block text-left">
            <ul className="space-y-4">
              {trustPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
