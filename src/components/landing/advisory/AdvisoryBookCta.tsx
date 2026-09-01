import { AdvisoryBookButton } from "./AdvisoryBookButton";

export function AdvisoryBookCta() {
  return (
    <section className="relative overflow-hidden py-14 grain sm:py-16 md:py-20 lg:py-24">
      <div className="absolute inset-0 bg-black" />
      <div className="absolute left-1/2 top-1/2 h-[clamp(220px,34vw,400px)] w-[min(800px,120vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[clamp(100px,15vw,180px)] animate-glow-pulse" />

      <div className="container relative z-10 px-5 sm:px-6 lg:px-12">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <AdvisoryBookButton />
        </div>
      </div>
    </section>
  );
}
