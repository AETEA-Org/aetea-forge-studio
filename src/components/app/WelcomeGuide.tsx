import { X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

const steps = [
  {
    id: 1,
    text: <>
      Click <strong>Settings</strong> at the bottom left (see arrow) and select a plan to add
      credits in <strong>Billing</strong>.
    </>,
  },
  {
    id: 2,
    text: <>
      Add your <strong>brief</strong> using the provided formats or type it
      directly in the <strong>description box</strong>.
    </>,
  },
  {
    id: 3,
    text: <>
      Choose <strong>Brainstorm</strong> to explore ideas and generate specific deliverables, or choose <strong>Campaign</strong> to dissect your brief, conduct research, develop
      strategy, build creative, and generate a broader range of assets.
    </>,
  },
];

interface WelcomeGuideProps {
  open: boolean;
  onClose: () => void;
}

export function WelcomeGuide({ open, onClose }: WelcomeGuideProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent
        hideCloseButton
        overlayClassName="bg-transparent bg-gradient-to-b from-black/90 to-black/80"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        className="welcome-guide-scrollbar max-h-[78vh] min-w-[260px] w-[70vw] max-w-[640px] justify-items-center overflow-y-auto rounded-2xl border border-primary/40 bg-background/95 p-[clamp(1rem,2vw,1.25rem)] shadow-[0_0_42px_rgba(48,145,255,0.28)] backdrop-blur-xl sm:max-h-[90vh] md:overflow-y-visible"
      >
        <DialogClose
          aria-label="Close welcome guide"
          className="absolute right-3 top-3 rounded-full border border-border/70 p-1 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <X className="h-3 w-3" />
        </DialogClose>

        <header className="w-full text-center">
          <DialogTitle className="font-display text-[clamp(2.5rem,7vw,3rem)] font-bold tracking-tight">
            Welcome!
          </DialogTitle>
          <DialogDescription className="mx-auto mt-0 whitespace-nowrap text-center text-[clamp(0.65rem,1.7vw,0.75rem)] leading-[clamp(0.875rem,2vw,1rem)] text-foreground/80">
            Let&apos;s get started in three simple steps:
          </DialogDescription>
        </header>

        <div className="mt-[clamp(0.75rem,2vw,1rem)] grid w-full gap-y-[clamp(0.75rem,2vw,1rem)] md:grid-cols-3 md:gap-x-[clamp(1.25rem,3vw,1.5rem)]">
          {steps.map((step, index) => (
            <section key={step.id} className="flex flex-col items-center px-[clamp(0.25rem,1vw,0.5rem)] text-center">
              <div className="flex h-[clamp(4.5rem,12vw,5rem)] w-[clamp(4.5rem,12vw,5rem)] shrink-0 items-center justify-center rounded-full border border-primary/60 bg-primary/10 font-sans text-[clamp(2rem,5.5vw,2.25rem)] font-extrabold text-primary shadow-[0_0_24px_rgba(48,145,255,0.18)]">
                {index + 1}
              </div>
              <p className="mt-[clamp(0.75rem,2vw,1rem)] break-normal hyphens-none text-pretty text-center [overflow-wrap:normal] text-[clamp(0.625rem,1.45vw,0.65rem)] leading-[clamp(0.875rem,1.8vw,0.9rem)] text-muted-foreground [&_strong]:font-bold [&_strong]:text-foreground">
                {step.text}
              </p>
            </section>
          ))}
        </div>

        <div className="mx-auto mt-[clamp(0.125rem,0.5vw,0.25rem)] h-px w-3/5 bg-border/70" />

        <div className="mx-auto w-full max-w-[520px] space-y-[clamp(0.125rem,0.5vw,0.25rem)] break-normal hyphens-none text-center [overflow-wrap:normal] text-[clamp(0.625rem,1.45vw,0.65rem)] leading-[clamp(0.875rem,1.8vw,0.9rem)] text-foreground/85">
          <p>Use the chat box to refine your work with AETEA.</p>
          <p>Hover over any element to see what it does.</p>
          <p>
            Choose from three intelligence settings: AETEA Lite, AETEA, or AETEA Max, or
            <br className="hidden sm:block" />
            keep using Auto to let AETEA select the best fit for the work at hand.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
