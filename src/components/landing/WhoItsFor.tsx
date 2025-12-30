import { Building2, Rocket, Megaphone, User } from "lucide-react";

const audiences = [
  {
    icon: Building2,
    title: "Small Business Owners",
    description:
      "Get professional output without building a full team. Focus on running your business while AETEA handles your creative and marketing needs.",
  },
  {
    icon: Rocket,
    title: "Founders & Entrepreneurs",
    description:
      "Launch premium brands and campaigns fast. Move quickly without sacrificing quality or consistency as you scale.",
  },
  {
    icon: Megaphone,
    title: "Creative / Marketing / Advertising Pros",
    description:
      "Increase output and turnaround time while reducing workflow chaos. Deliver more for clients without burning out.",
  },
  {
    icon: User,
    title: "Freelancers & Creative Pros",
    description:
      "Align strategy → creative → distribution without endless handoffs. Do the work of a team with intelligent support.",
  },
];

export function WhoItsFor() {
  return (
    <section id="who-its-for" className="py-24 md:py-32">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Who AETEA Is For
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built for creators who need to move fast without compromising quality.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {audiences.map((audience) => (
            <div
              key={audience.title}
              className="group bg-card rounded-xl p-6 border border-border hover:border-primary/40 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <audience.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-3">{audience.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {audience.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
