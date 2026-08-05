import { useEffect } from "react";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { AdvisoryAbout } from "@/components/landing/advisory/AdvisoryAbout";
import { AdvisoryAudience } from "@/components/landing/advisory/AdvisoryAudience";
import { AdvisoryBookCta } from "@/components/landing/advisory/AdvisoryBookCta";
import { AdvisoryBoundaries } from "@/components/landing/advisory/AdvisoryBoundaries";
import { AdvisoryClarifies } from "@/components/landing/advisory/AdvisoryClarifies";
import { AdvisoryHero } from "@/components/landing/advisory/AdvisoryHero";
import { AdvisoryHowWeWork } from "@/components/landing/advisory/AdvisoryHowWeWork";
import { AdvisoryMobileStickyCta } from "@/components/landing/advisory/AdvisoryMobileStickyCta";
import { AdvisoryPhilosophy } from "@/components/landing/advisory/AdvisoryPhilosophy";

export default function Advisory() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Advisory · AETEA";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20 dark md:pb-0">
      <Navbar />
      <main>
        <AdvisoryHero />
        <AdvisoryPhilosophy />
        <AdvisoryClarifies />
        <AdvisoryHowWeWork />
        <AdvisoryAudience />
        <AdvisoryBoundaries />
        <AdvisoryBookCta />
        <AdvisoryAbout />
      </main>
      <Footer />
      <AdvisoryMobileStickyCta />
    </div>
  );
}
