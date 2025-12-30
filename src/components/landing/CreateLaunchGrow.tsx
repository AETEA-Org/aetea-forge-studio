import { useState } from "react";

const pillars = [
  {
    id: "create",
    title: "Create",
    tagline: "Turn your vision into a clear direction people feel.",
    capabilities: [
      "Brand strategy, positioning, naming, messaging",
      "Campaign ideas, content concepts, creative direction",
      "Copywriting, design direction, scripts, storyboards",
      "Lyrics, music direction, hooks, creative writing",
    ],
    outcome: "Clarity + taste + a plan your team can execute.",
  },
  {
    id: "launch",
    title: "Launch",
    tagline: "Produce real assets, in the formats the market needs.",
    capabilities: [
      "Film/video production and editing",
      "Voiceover and audio production",
      "Web, apps, and digital experiences",
      "PR, email marketing, and publishing",
    ],
    outcome: "Campaign-ready deliverables — faster, cleaner, on-brand.",
  },
  {
    id: "grow",
    title: "Grow",
    tagline: "Measure what matters, learn faster, scale what works.",
    capabilities: [
      "Performance summaries and analytics",
      "Content scheduling and calendar management",
      "Monitoring and reporting dashboards",
      "Growth strategy and iteration loops",
    ],
    outcome: "Stronger feedback loops and smarter growth decisions.",
  },
];

export function CreateLaunchGrow() {
  const [activeTab, setActiveTab] = useState("create");
  const activePillar = pillars.find((p) => p.id === activeTab)!;

  return (
    <section className="py-32 md:py-40 relative grain">
      <div className="container px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-20">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="h-px w-12 bg-border" />
              <span className="text-xs uppercase tracking-[0.3em] text-foreground/60">
                The Journey
              </span>
              <div className="h-px w-12 bg-border" />
            </div>
            
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              <span className={activeTab === "create" ? "text-primary" : "text-foreground/35 cursor-pointer transition-colors hover:text-foreground/60"} onClick={() => setActiveTab("create")}>Create</span>
              <span className="text-foreground/25 mx-2">•</span>
              <span className={activeTab === "launch" ? "text-primary" : "text-foreground/35 cursor-pointer transition-colors hover:text-foreground/60"} onClick={() => setActiveTab("launch")}>Launch</span>
              <span className="text-foreground/25 mx-2">•</span>
              <span className={activeTab === "grow" ? "text-primary" : "text-foreground/35 cursor-pointer transition-colors hover:text-foreground/60"} onClick={() => setActiveTab("grow")}>Grow</span>
            </h2>
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
