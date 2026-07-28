import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WhatAeteaIs() {
  return (
    <section id="what-aetea-is" className="py-28 md:py-36 relative overflow-hidden grain">
      {/* Subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />
      
      <div className="container relative px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          {/* Section label */}
          <div 
            className="flex items-center gap-3 mb-12 opacity-0 animate-fade-in"
            style={{ animationDelay: '0.1s' }}
          >
            <span className="text-xs uppercase tracking-[0.3em] text-foreground/60">
              AETEA
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Main statement */}
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-10 text-foreground">
            An intelligence that thinks with you and delivers with you.
          </h2>

          {/* Supporting text */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-16">
            <p className="text-lg text-foreground/70 leading-relaxed">
              Bring a question, goal, brief, or existing material. AETEA helps you research the context, choose the direction, and give the work form.
            </p>
            <p className="text-lg text-foreground/70 leading-relaxed">
              AETEA brings guided workflow and real deliverables together across brand, content, production, and growth. The work stays connected as it moves from brief to market.
            </p>
          </div>

          {/* CTA */}
          <div className="mt-12">
            <Link to="/auth">
              <Button 
                variant="outline"
                size="lg"
                className="border-foreground/20 text-foreground hover:bg-foreground/10 hover:border-foreground/40 rounded-full px-8 h-12 group transition-all duration-300"
              >
                Explore AETEA
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
