import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Layers, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const proofPoints = [
  { icon: Layers, text: "Strategy + Creative + Production in one flow" },
  { icon: Sparkles, text: "Multi-format outputs for every platform" },
  { icon: CheckCircle, text: "AI-assisted, human-checked checkpoints" },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="container relative z-10 px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Headline */}
          <h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 opacity-0 animate-fade-in"
            style={{ animationDelay: '0.1s' }}
          >
            All you need.{" "}
            <span className="text-primary">Create</span> →{" "}
            <span className="text-primary">Launch</span> →{" "}
            <span className="text-primary">Grow.</span>
          </h1>

          {/* Subline */}
          <p 
            className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-medium mb-6 opacity-0 animate-fade-in"
            style={{ animationDelay: '0.2s' }}
          >
            One creative intelligence, backed by everything required to envision, execute and excel.
          </p>

          {/* Description */}
          <p 
            className="text-base sm:text-lg text-muted-foreground/80 max-w-2xl mx-auto mb-10 opacity-0 animate-fade-in"
            style={{ animationDelay: '0.3s' }}
          >
            AETEA is your end-to-end creative OS/partner for strategy, creative direction, 
            production, distribution, and growth—built for small business owners, founders, 
            freelancers and creative/marketing teams who need faster turnaround without 
            sacrificing taste, consistency, or results.
          </p>

          {/* CTAs */}
          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 opacity-0 animate-fade-in"
            style={{ animationDelay: '0.4s' }}
          >
            <Link to="/auth">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-12">
                Start a Brief
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#what-aetea-is">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-border hover:bg-secondary px-8 h-12"
              >
                See What AETEA Can Do
              </Button>
            </a>
          </div>

          {/* Proof Points */}
          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 opacity-0 animate-fade-in"
            style={{ animationDelay: '0.5s' }}
          >
            {proofPoints.map((point, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <point.icon className="h-4 w-4 text-primary" />
                <span>{point.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
