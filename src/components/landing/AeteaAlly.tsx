import { User } from "lucide-react";
import aeteaWordmark from "@/assets/aetea-auth-wordmark.png";
import {
  LANDING_SECTION_STANDARD,
  LANDING_SECTION_TRAILING,
} from "./landingStyles";

function AmplifyConnector() {
  return (
    <svg
      width="72"
      height="34"
      viewBox="0 0 72 34"
      aria-hidden="true"
      className="shrink-0 text-foreground"
      style={{ filter: "drop-shadow(0 0 2px #d9efff) drop-shadow(0 0 4px #32a7ff) drop-shadow(0 0 8px #0064ff)" }}
    >
      <path
        d="M7 17 H65 M7 17 L14 24 M58 10 L65 17"
        stroke="currentColor"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhilosophyInfographic() {
  return (
    <div className="relative mx-auto w-full max-w-[300px] rounded-3xl border border-blue-400/70 bg-card/20 px-3 py-6 shadow-[0_0_22px_rgba(48,145,255,0.4),inset_0_0_16px_rgba(48,145,255,0.12)] sm:max-w-[340px] sm:px-4 sm:py-7">
      <div className="flex items-center justify-center gap-3 sm:gap-4">
        <User
          className="-mr-1.5 h-12 w-12 shrink-0 text-foreground sm:h-14 sm:w-14"
          style={{ filter: "drop-shadow(0 0 2px #d9efff) drop-shadow(0 0 4px #32a7ff) drop-shadow(0 0 8px #0064ff)" }}
          strokeWidth={1.65}
          aria-hidden="true"
        />

        <AmplifyConnector />

        <img
          src={aeteaWordmark}
          alt=""
          aria-hidden="true"
          className="-ml-1.5 h-auto w-[102px] shrink-0 object-contain sm:w-[112px]"
          style={{ filter: "drop-shadow(0 0 2px #d9efff) drop-shadow(0 0 4px #32a7ff) drop-shadow(0 0 8px #0064ff)" }}
        />
      </div>

      <p
        className="mx-auto mt-2.5 w-full text-center font-display text-base font-bold tracking-tight text-foreground sm:text-lg"
      >
        Intelligence at work
      </p>
    </div>
  );
}

function PhilosophySection() {
  return (
    <section className={`${LANDING_SECTION_STANDARD} relative grain`}>
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

            <div className="lg:col-span-2 lg:sticky lg:top-28 lg:pt-12">
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
    <section className={`${LANDING_SECTION_TRAILING} relative grain`}>
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
