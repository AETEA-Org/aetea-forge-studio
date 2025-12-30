import { User, Cpu, ArrowRight } from "lucide-react";

export function AIAlly() {
  return (
    <section className="py-32 md:py-40 relative grain">
      <div className="container px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-16 items-center">
            {/* Text */}
            <div className="lg:col-span-3">
              <div className="flex items-center gap-3 mb-8">
                <span className="text-xs uppercase tracking-[0.3em] text-foreground/60">
                  Philosophy
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-8 text-foreground">
                AI as your ally,
                <span className="text-foreground/60"> not your replacement.</span>
              </h2>
              
              <p className="text-lg text-foreground/70 leading-relaxed mb-6">
                AETEA is built to amplify human potential. AI accelerates execution, 
                widens creative options, and frees you for the decisions that matter most.
              </p>
              
              <p className="text-foreground/60 leading-relaxed">
                You stay in control of taste, direction, and final decisions. 
                The AI handles the heavy lifting so you can focus on what you do best.
              </p>
            </div>

            {/* Visual element - simplified and elegant */}
            <div className="lg:col-span-2">
              <div className="relative">
                {/* Human side */}
                <div className="flex items-center justify-center gap-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-foreground/5 border border-foreground/10 flex items-center justify-center transition-all duration-500 hover:border-foreground/20 hover:bg-foreground/10">
                      <User className="w-8 h-8 text-foreground/70" />
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-foreground/50">You</span>
                  </div>
                  
                  {/* Connection */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-px bg-gradient-to-r from-foreground/20 to-primary/40" />
                      <ArrowRight className="w-4 h-4 text-primary/60" />
                      <div className="w-8 h-px bg-gradient-to-r from-primary/40 to-foreground/20" />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.15em] text-primary/60">Amplify</span>
                  </div>
                  
                  {/* AI side */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center transition-all duration-500 hover:border-primary/40 hover:bg-primary/20 hover:shadow-[0_0_30px_hsla(220,100%,60%,0.2)]">
                      <Cpu className="w-8 h-8 text-primary" />
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-primary/70">AI</span>
                  </div>
                </div>
                
                {/* Outcome */}
                <div className="mt-8 text-center">
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-border/50 bg-card/30">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm text-foreground/70">Creative Superpower</span>
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