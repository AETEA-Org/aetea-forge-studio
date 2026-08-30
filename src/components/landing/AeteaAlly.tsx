import { User } from "lucide-react";

function AmplifyArrows() {
  return (
    <svg
      width="56"
      height="28"
      viewBox="0 0 56 28"
      aria-hidden="true"
      className="text-primary/70"
    >
      {/* AETEA → human (top arrow, points left) */}
      <path
        d="M48 9 H12 M16 6 L12 9 L16 12"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* human → AETEA (bottom arrow, points right) */}
      <path
        d="M8 19 H44 M40 16 L44 19 L40 22"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhilosophyInfographic() {
  return (
    <div className="relative rounded-3xl border border-border/50 bg-card/20 px-6 py-10 sm:px-8">
      <div className="flex items-center justify-center gap-8 sm:gap-10">
        <User className="h-10 w-10 shrink-0 text-foreground/75" strokeWidth={1.5} aria-hidden="true" />

        <div className="flex flex-col items-center gap-2">
          <AmplifyArrows />
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary/70">Amplify</span>
        </div>

        <img
          src="/favicon.png"
          alt=""
          aria-hidden="true"
          className="h-10 w-10 shrink-0 object-contain"
        />
      </div>

      <p className="mt-8 text-center text-sm tracking-wide text-foreground/70 sm:text-base">
        Intelligence at work
      </p>
    </div>
  );
}

function PhilosophySection() {
  return (
    <section className="relative grain py-24 md:py-32">
      <div className="container px-6 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-start gap-12 lg:grid-cols-5 lg:gap-16">
            <div className="lg:col-span-3">
              <div className="mb-8 flex items-center gap-3">
                <span className="text-xs uppercase tracking-[0.3em] text-foreground/60">
                  Philosophy
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <h2 className="mb-8 font-display text-3xl font-bold leading-[1.15] tracking-tight text-foreground sm:text-4xl md:text-5xl">
                AETEA as your ally,
                <span className="text-foreground/60"> not your replacement.</span>
              </h2>

              <div className="space-y-7">
                <p className="text-lg leading-[1.75] text-foreground/70">
                  AETEA exists to amplify human potential by bringing research, strategy, and creative into one continuous movement: from brief to market and from response to what follows.
                </p>

                <p className="leading-[1.75] text-foreground/60">
                  Research receives, discovers, examines, and reveals. Strategy discerns, chooses, connects, and directs. Creative gives ideas perceptible form. Together, they become one experience of intelligence at work.
                </p>

                <p className="leading-[1.75] text-foreground/60">
                  You remain in control of taste, direction, and final decisions. AETEA handles the heavy lifting so you can focus on what you do best.
                </p>
              </div>
            </div>

            <div className="lg:col-span-2 lg:sticky lg:top-28">
              <PhilosophyInfographic />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BroughtToLifeSection() {
  return (
    <section className="relative grain pb-24 md:pb-32">
      <div className="container px-6 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center gap-3">
            <span className="text-xs uppercase tracking-[0.3em] text-foreground/60">
              Brought to life
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <p className="max-w-3xl leading-relaxed text-foreground/70">
            AETEA is a family venture founded by Ash Tal with Abdur.
          </p>
        </div>
      </div>
    </section>
  );
}

export function AeteaAlly() {
  return (
    <>
      <PhilosophySection />
      <BroughtToLifeSection />
    </>
  );
}
