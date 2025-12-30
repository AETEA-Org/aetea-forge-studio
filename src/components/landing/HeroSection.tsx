import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden grain">
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] animate-glow-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-glow-pulse" style={{ animationDelay: '1.5s' }} />

      <div className="container relative z-10 px-6 lg:px-12 py-32 md:py-40">
        <div className="max-w-5xl mx-auto">
          {/* Overline */}
          <div 
            className="flex items-center gap-3 mb-8 opacity-0 animate-fade-in"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-muted-foreground/50" />
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Creative Intelligence Platform
            </span>
          </div>

          {/* Headline */}
          <h1 
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] mb-8 opacity-0 animate-fade-in"
            style={{ animationDelay: '0.2s' }}
          >
            All you need.
            <br />
            <span className="text-gradient-blue">Create</span>
            <span className="text-muted-foreground/40"> → </span>
            <span className="text-gradient-blue">Launch</span>
            <span className="text-muted-foreground/40"> → </span>
            <span className="text-gradient-blue">Grow.</span>
          </h1>

          {/* Subline */}
          <p 
            className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl leading-relaxed mb-12 opacity-0 animate-fade-in"
            style={{ animationDelay: '0.4s' }}
          >
            One creative intelligence, backed by everything required to envision, execute and excel.
          </p>

          {/* CTAs */}
          <div 
            className="flex flex-col sm:flex-row items-start gap-4 mb-20 opacity-0 animate-fade-in"
            style={{ animationDelay: '0.6s' }}
          >
            <Link to="/auth">
              <Button 
                size="lg" 
                className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-8 h-14 text-base group"
              >
                Start a Brief
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <a href="#what-aetea-is">
              <Button 
                size="lg" 
                variant="ghost" 
                className="text-muted-foreground hover:text-foreground hover:bg-transparent rounded-full px-8 h-14 text-base"
              >
                Learn more
              </Button>
            </a>
          </div>

          {/* Proof Points */}
          <div 
            className="flex flex-wrap gap-x-8 gap-y-4 opacity-0 animate-fade-in"
            style={{ animationDelay: '0.8s' }}
          >
            {[
              "Strategy + Creative + Production",
              "Multi-format outputs",
              "AI-assisted, human-checked",
            ].map((point, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-1 h-1 rounded-full bg-primary" />
                <span className="text-sm text-muted-foreground">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-0 animate-fade-in" style={{ animationDelay: '1.2s' }}>
        <div className="w-6 h-10 rounded-full border border-muted-foreground/30 flex items-start justify-center p-2">
          <div className="w-1 h-2 rounded-full bg-muted-foreground/50 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
