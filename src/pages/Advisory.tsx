import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { AdvisoryAbout } from "@/components/landing/advisory/AdvisoryAbout";
import { AdvisoryAudience } from "@/components/landing/advisory/AdvisoryAudience";
import { AdvisoryBookCta } from "@/components/landing/advisory/AdvisoryBookCta";
import { AdvisoryBoundaries } from "@/components/landing/advisory/AdvisoryBoundaries";
import { AdvisoryClarifies } from "@/components/landing/advisory/AdvisoryClarifies";
import { AdvisoryHero } from "@/components/landing/advisory/AdvisoryHero";
import { AdvisoryHowWeWork } from "@/components/landing/advisory/AdvisoryHowWeWork";
import { AdvisoryPhilosophy } from "@/components/landing/advisory/AdvisoryPhilosophy";
import { ADVISORY_PAGE } from "@/seo/pages";
import { usePageMetadata } from "@/seo/usePageMetadata";

export default function Advisory() {
  usePageMetadata(ADVISORY_PAGE);

  return (
    <div className="min-h-screen bg-background dark">
      <Navbar />
      <main className="flex flex-col gap-8">
        <AdvisoryHero />
        <AdvisoryPhilosophy />
        <AdvisoryClarifies />
        <AdvisoryHowWeWork />
        <AdvisoryAudience />
        <AdvisoryBoundaries />
        <AdvisoryBookCta />
        <AdvisoryAbout />
      </main>
      <Footer advisory />
    </div>
  );
}
