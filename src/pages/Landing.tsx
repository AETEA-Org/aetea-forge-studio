import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { WhatAeteaIs } from "@/components/landing/WhatAeteaIs";
import { CreateLaunchGrow } from "@/components/landing/CreateLaunchGrow";
import { ServicesGrid } from "@/components/landing/ServicesGrid";
import { WhoItsFor } from "@/components/landing/WhoItsFor";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { AIAlly } from "@/components/landing/AIAlly";
import { TrustSafety } from "@/components/landing/TrustSafety";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <WhatAeteaIs />
        <CreateLaunchGrow />
        <ServicesGrid />
        <WhoItsFor />
        <HowItWorks />
        <AIAlly />
        <TrustSafety />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
