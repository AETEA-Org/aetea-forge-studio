export function WhatAeteaIs() {
  return (
    <section id="what-aetea-is" className="py-32 md:py-40 relative overflow-hidden">
      {/* Subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/50 to-transparent" />
      
      <div className="container relative px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          {/* Section label */}
          <div 
            className="flex items-center gap-3 mb-12 opacity-0 animate-fade-in"
            style={{ animationDelay: '0.1s' }}
          >
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              The Platform
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Main statement */}
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-10">
            A creative OS that thinks with you —
            <span className="text-muted-foreground"> and delivers with you.</span>
          </h2>

          {/* Supporting text */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-16">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Most platforms just give you tools — you still do all the thinking and execution. 
              Agencies give you output, but it's slow and expensive.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              AETEA combines guided workflow with real deliverables across brand, content, 
              production, and growth. Think of it as your creative department in a box.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
