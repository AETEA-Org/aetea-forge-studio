import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/aetea-logo-white.png";

export function HeroSection() {
  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
      {/* Pure black background for top section where logo sits */}
      <div className="absolute inset-0 bg-black" />
      
      {/* Futuristic gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-background" />
      
      {/* Animated grid lines - futuristic touch */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(hsl(220 100% 60% / 0.3) 1px, transparent 1px),
                          linear-gradient(90deg, hsl(220 100% 60% / 0.3) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />
      
      {/* Gradient orbs - more subtle */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[180px] animate-glow-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[150px] animate-glow-pulse" style={{ animationDelay: '1.5s' }} />

      <div className="container relative z-10 px-6 lg:px-12 py-32 md:py-40">
        <div className="max-w-5xl mx-auto">
          {/* Logo - larger and prominent */}
          <div 
            className="mb-16 opacity-0 animate-fade-in"
            style={{ animationDelay: '0.1s' }}
          >
            <img 
              src={logo} 
              alt="AETEA" 
              className="h-14 md:h-20 w-auto" 
            />
          </div>

          {/* Headline */}
          <h1 
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] mb-8 opacity-0 animate-fade-in"
            style={{ animationDelay: '0.2s' }}
          >
            <span className="text-foreground">All you need.</span>
            <br />
            <span className="text-gradient-blue">Create</span>
            <span className="text-foreground/30 mx-2">→</span>
            <span className="text-gradient-blue">Launch</span>
            <span className="text-foreground/30 mx-2">→</span>
            <span className="text-gradient-blue">Grow.</span>
          </h1>

          {/* Subline */}
          <p 
            className="text-lg sm:text-xl md:text-2xl text-foreground/70 max-w-2xl leading-relaxed mb-12 opacity-0 animate-fade-in"
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
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 h-14 text-base group transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_hsla(220,100%,60%,0.4)]"
              >
                Start a Brief
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <a href="#what-aetea-is">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-foreground/20 text-foreground hover:bg-foreground/10 hover:border-foreground/40 rounded-full px-8 h-14 text-base transition-all duration-300"
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
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-sm text-foreground/60">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-0 animate-fade-in" style={{ animationDelay: '1.2s' }}>
        <div className="w-6 h-10 rounded-full border border-foreground/20 flex items-start justify-center p-2">
          <div className="w-1 h-2 rounded-full bg-foreground/40 animate-bounce" />
        </div>
      </div>
    </section>
  );
}