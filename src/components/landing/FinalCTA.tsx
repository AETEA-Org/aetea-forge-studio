import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCTA() {
  return (
    <section className="py-32 md:py-40 relative grain overflow-hidden">
      {/* Pure black background */}
      <div className="absolute inset-0 bg-black" />
      
      {/* Gradient orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/15 rounded-full blur-[180px] animate-glow-pulse" />
      
      <div className="container relative z-10 px-6 lg:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-8 text-foreground drop-shadow-[0_2px_30px_hsl(var(--background))]">
            Ready to turn direction into deliverables?
          </h2>
          
          <p className="text-xl text-foreground/70 mb-12">
            Start your first brief and see what AETEA can do for you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth">
              <Button 
                size="lg" 
                className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-8 h-14 text-base group"
              >
                Start a Brief
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <a href="mailto:hello@aetea.ai?subject=Demo%20Request">
              <Button 
                size="lg" 
                variant="ghost" 
                className="text-foreground/70 hover:text-foreground hover:bg-transparent rounded-full px-8 h-14 text-base"
              >
                Book a Demo
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
