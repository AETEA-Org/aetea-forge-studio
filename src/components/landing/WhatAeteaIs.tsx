import { Zap, Users, Target } from "lucide-react";

export function WhatAeteaIs() {
  return (
    <section id="what-aetea-is" className="py-24 md:py-32 bg-secondary/30">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            A creative OS/partner that thinks with you — and delivers with you.
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Most platforms just give you tools — you still do all the thinking and execution. 
            Agencies give you output, but it's slow and expensive.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-card rounded-xl p-8 border border-border hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Guided Workflow</h3>
            <p className="text-muted-foreground">
              AETEA guides you from brief to delivery with structured steps, 
              not just a blank canvas.
            </p>
          </div>

          <div className="bg-card rounded-xl p-8 border border-border hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Real Deliverables</h3>
            <p className="text-muted-foreground">
              Get production-ready assets across brand, content, campaigns, 
              and growth — not just ideas.
            </p>
          </div>

          <div className="bg-card rounded-xl p-8 border border-border hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Human + AI</h3>
            <p className="text-muted-foreground">
              AI accelerates execution while humans retain creative control 
              at every decision point.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
