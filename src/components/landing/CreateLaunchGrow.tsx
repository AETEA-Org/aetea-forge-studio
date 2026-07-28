import { useState } from "react";

const pillars = [
  {
    id: "research",
    title: "Research",
    tagline: "See what matters.",
    capabilities: [
      "Industry and market landscape",
      "Audience needs and behaviour",
      "Competitor positions and gaps",
      "Tensions, opportunities, and questions to pursue",
    ],
    outcome: "A focused view of the context.",
  },
  {
    id: "strategy",
    title: "Strategy",
    tagline: "Choose the way forward.",
    capabilities: [
      "Positioning and narrative",
      "Audience segments, personas, and journeys",
      "Messaging and creative foundation",
      "Channels, rollout, and measurement",
    ],
    outcome: "Decisions ready to guide the work.",
  },
  {
    id: "creative",
    title: "Creative",
    tagline: "Give the direction form.",
    capabilities: [
      "Campaign key visuals and content concepts",
      "Copy, scripts, and storyboards",
      "Visual, film, audio, print, out-of-home, point-of-sale, PR, event, and digital assets",
      "Deliverables and rollout packs",
    ],
    outcome: "Work ready to make, test, and use.",
  },
];

export function CreateLaunchGrow() {
  const [activeTab, setActiveTab] = useState("research");
  const activePillar = pillars.find((p) => p.id === activeTab)!;

  return (
    <section className="py-24 md:py-32 relative grain">
      <div className="container px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-14 md:mb-16">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="h-px w-12 bg-border" />
              <span className="text-xs uppercase tracking-[0.3em] text-foreground/60">
                The Work
              </span>
              <div className="h-px w-12 bg-border" />
            </div>
            
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span className={activeTab === "research" ? "text-primary" : "text-foreground/35 cursor-pointer transition-colors hover:text-foreground/60"} onClick={() => setActiveTab("research")}>Research</span>
              <span className="text-foreground/25">•</span>
              <span className={activeTab === "strategy" ? "text-primary" : "text-foreground/35 cursor-pointer transition-colors hover:text-foreground/60"} onClick={() => setActiveTab("strategy")}>Strategy</span>
              <span className="text-foreground/25">•</span>
              <span className={activeTab === "creative" ? "text-primary" : "text-foreground/35 cursor-pointer transition-colors hover:text-foreground/60"} onClick={() => setActiveTab("creative")}>Creative</span>
            </h2>

            <p className="mt-6 text-lg text-foreground/60">
              Brainstorm an idea or work through a campaign.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-16">
            <div className="inline-flex p-1 rounded-full glass">
              {pillars.map((pillar) => (
                <button
                  key={pillar.id}
                  onClick={() => setActiveTab(pillar.id)}
                  className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeTab === pillar.id
                      ? "bg-foreground text-background"
                      : "text-foreground/65 hover:text-foreground"
                  }`}
                >
                  {pillar.title}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <p className="text-2xl sm:text-3xl font-medium leading-relaxed mb-8 text-foreground">
                {activePillar.tagline}
              </p>
              <ul className="space-y-4">
                {activePillar.capabilities.map((cap, i) => (
                  <li key={i} className="flex items-start gap-4 text-foreground/65">
                    <span className="w-6 h-6 rounded-full border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">{String(i + 1).padStart(2, "0")}</span>
                    </span>
                    {cap}
                  </li>
                ))}
              </ul>
            </div>

              <div className="lg:pt-8">
              <div className="p-8 rounded-3xl glass glow-sm">
                <span className="text-xs uppercase tracking-[0.2em] text-foreground/60 mb-4 block">
                  Outcome
                </span>
                <p className="text-xl font-medium text-foreground">
                  {activePillar.outcome}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
