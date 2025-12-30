import { Brain, Zap, Shield, Sparkles } from "lucide-react";

const features = [
  { icon: Zap, text: "Speed execution without losing quality" },
  { icon: Sparkles, text: "Widen creative options and possibilities" },
  { icon: Brain, text: "Free humans for taste and decisions" },
  { icon: Shield, text: "Maintain consistency across outputs" },
];

export function AIAlly() {
  return (
    <section className="py-24 md:py-32">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
                AI as Your Ally
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                AETEA is built to amplify human potential, not replace it. AI works as 
                your partner — accelerating execution, widening creative options, and 
                freeing you for the decisions that matter most.
              </p>
              <p className="text-muted-foreground">
                You stay in control of taste, direction, and final decisions. 
                The AI handles the heavy lifting so you can focus on what you do best.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-card rounded-xl p-5 border border-border hover:border-primary/30 transition-colors"
                >
                  <feature.icon className="h-6 w-6 text-primary mb-3" />
                  <p className="text-sm font-medium">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
