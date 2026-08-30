import { User, Cpu, ArrowRight } from "lucide-react";

export function AeteaAlly() {
  return (
    <section className="py-28 md:py-36 relative grain">
      <div className="container px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-start">
            {/* Text */}
            <div className="lg:col-span-3">
              <div className="flex items-center gap-3 mb-8">
                <span className="text-xs uppercase tracking-[0.3em] text-foreground/60">
                  Philosophy
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.15] mb-8 text-foreground">
                AETEA as your ally,
                <span className="text-foreground/60"> not your replacement.</span>
              </h2>

              <div className="space-y-7">
                <p className="text-lg text-foreground/70 leading-[1.75]">
                  AETEA exists to amplify human potential by bringing research, strategy, and creative into one continuous movement: from brief to market and from response to what follows.
                </p>

                <p className="text-foreground/60 leading-[1.75]">
                  Research receives, discovers, examines, and reveals. Strategy discerns, chooses, connects, and directs. Creative gives ideas perceptible form. Together, they become one experience of intelligence at work.
                </p>

                <p className="text-foreground/60 leading-[1.75]">
                  You remain in control of taste, direction, and final decisions. AETEA handles the heavy lifting so you can focus on what you do best.
                </p>
              </div>

              <div className="pt-8 mt-8 border-t border-border">
                <span className="text-xs uppercase tracking-[0.3em] text-foreground/60 mb-3 block">
                  Brought to life
                </span>
                <p className="text-foreground/70 leading-relaxed">
                  AETEA is a family venture founded by Ash Tal with Abdur.
                </p>
              </div>
            </div>

            {/* Visual — sticky on desktop so it stays paired with the copy */}
            <div className="lg:col-span-2 lg:sticky lg:top-28">
              <div className="relative rounded-3xl border border-border/50 bg-card/20 p-8">
                <div className="flex items-center justify-center gap-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-foreground/5 border border-foreground/10 flex items-center justify-center transition-all duration-500 hover:border-foreground/20 hover:bg-foreground/10">
                      <User className="w-8 h-8 text-foreground/70" />
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-foreground/50">You</span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-px bg-gradient-to-r from-foreground/20 to-primary/40" />
                      <ArrowRight className="w-4 h-4 text-primary/60" />
                      <div className="w-8 h-px bg-gradient-to-r from-primary/40 to-foreground/20" />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.15em] text-primary/60">Amplify</span>
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center transition-all duration-500 hover:border-primary/40 hover:bg-primary/20 hover:shadow-[0_0_30px_hsla(220,100%,60%,0.2)]">
                      <Cpu className="w-8 h-8 text-primary" />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.15em] text-primary/70 text-center max-w-[5.5rem] leading-tight">
                      AETEA
                    </span>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-border/50 bg-card/30">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm text-foreground/70">intelligence at work</span>
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
