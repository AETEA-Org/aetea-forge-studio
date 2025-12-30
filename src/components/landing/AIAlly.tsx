export function AIAlly() {
  return (
    <section className="py-32 md:py-40 relative grain">
      <div className="container px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-16 items-center">
            {/* Text */}
            <div className="lg:col-span-3">
              <div className="flex items-center gap-3 mb-8">
                <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Philosophy
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-8">
                AI as your ally,
                <span className="text-muted-foreground"> not your replacement.</span>
              </h2>
              
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                AETEA is built to amplify human potential. AI accelerates execution, 
                widens creative options, and frees you for the decisions that matter most.
              </p>
              
              <p className="text-muted-foreground leading-relaxed">
                You stay in control of taste, direction, and final decisions. 
                The AI handles the heavy lifting so you can focus on what you do best.
              </p>
            </div>

            {/* Visual element */}
            <div className="lg:col-span-2">
              <div className="aspect-square rounded-3xl glass glow relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-primary/20 blur-3xl animate-glow-pulse" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="font-display text-6xl font-bold text-gradient-blue">AI</span>
                    <span className="block text-xs uppercase tracking-[0.3em] text-muted-foreground mt-2">+ Human</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
