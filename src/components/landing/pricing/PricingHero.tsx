export function PricingHero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-8 md:pt-36 md:pb-12">
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-background" />
      <div className="container relative z-10 px-6 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-white/60 sm:text-5xl md:text-6xl lg:text-7xl">
            Pricing &amp; Packages
          </h1>
        </div>
      </div>
    </section>
  );
}
