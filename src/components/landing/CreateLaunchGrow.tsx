import { Palette, Rocket, TrendingUp } from "lucide-react";

const pillars = [
  {
    icon: Palette,
    title: "Create",
    tagline: "Turn your vision into a clear direction people feel.",
    capabilities: [
      "Brand strategy, positioning, naming, messaging",
      "Campaign ideas, content concepts, creative direction",
      "Copywriting, design direction, scripts, storyboards",
      "Lyrics, music direction, hooks, creative writing support",
    ],
    outcome: "Outcome: clarity + taste + a plan your team (or you) can execute.",
  },
  {
    icon: Rocket,
    title: "Launch",
    tagline: "Produce real assets, in the formats the market needs.",
    capabilities: [
      "Film/video production and editing",
      "Voiceover and audio production",
      "Web, apps, and digital experiences",
      "PR, email marketing, and publishing",
    ],
    outcome: "Outcome: campaign-ready deliverables — faster, cleaner, on-brand.",
  },
  {
    icon: TrendingUp,
    title: "Grow",
    tagline: "Measure what matters, learn faster, and scale what works.",
    capabilities: [
      "Performance summaries and analytics support",
      "Content scheduling and calendar management",
      "Monitoring and reporting dashboards",
      "Growth strategy and iteration loops",
    ],
    outcome: "Outcome: stronger feedback loops and smarter growth decisions.",
  },
];

export function CreateLaunchGrow() {
  return (
    <section className="py-24 md:py-32">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            <span className="text-primary">Create</span> •{" "}
            <span className="text-primary">Launch</span> •{" "}
            <span className="text-primary">Grow</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From initial concept to market growth — one integrated workflow.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pillars.map((pillar, index) => (
            <div 
              key={pillar.title}
              className="group relative bg-card rounded-2xl p-8 border border-border hover:border-primary/40 transition-all duration-300"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <pillar.icon className="h-7 w-7 text-primary" />
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold mb-2">{pillar.title}</h3>
              
              {/* Tagline */}
              <p className="text-muted-foreground mb-6">{pillar.tagline}</p>

              {/* Capabilities */}
              <ul className="space-y-3 mb-6">
                {pillar.capabilities.map((cap, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    {cap}
                  </li>
                ))}
              </ul>

              {/* Outcome */}
              <p className="text-sm font-medium text-primary/80 border-t border-border pt-4">
                {pillar.outcome}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
