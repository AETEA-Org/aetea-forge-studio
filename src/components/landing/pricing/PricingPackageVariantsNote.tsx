import { PRICING_DISCLAIMER } from "./pricingStyles";

type PricingPackageVariantsNoteProps = {
  note: string;
};

export function PricingPackageVariantsNote({
  note,
}: PricingPackageVariantsNoteProps) {
  return (
    <section className="w-full py-4 md:py-8">
      <div className="container px-6 lg:px-12">
        <p
          className={`mx-auto max-w-6xl whitespace-pre-line text-center font-normal ${PRICING_DISCLAIMER} text-white/70`}
        >
          {note}
        </p>
      </div>
    </section>
  );
}
