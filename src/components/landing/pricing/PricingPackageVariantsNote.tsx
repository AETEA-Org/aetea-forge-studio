import { PRICING_BODY, PRICING_SECTION_TITLE } from "./pricingStyles";

type PricingPackageVariantsNoteProps = {
  note: string;
};

export function PricingPackageVariantsNote({
  note,
}: PricingPackageVariantsNoteProps) {
  return (
    <section className="mb-6 mt-2 w-full" aria-labelledby="pricing-what-you-receive">
      <div className="container px-6 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <h2 id="pricing-what-you-receive" className={`mb-6 ${PRICING_SECTION_TITLE} text-foreground`}>
            What you receive
          </h2>
          <div className={`space-y-4 ${PRICING_BODY}`}>
            {note.split("\n\n").map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
