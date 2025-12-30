import { Loader2, ArrowRight } from "lucide-react";
import { useProjectStrategy } from "@/hooks/useProjectSection";
import type { StrategyModel } from "@/types/api";

interface StrategyTabProps {
  projectId: string;
}

export function StrategyTab({ projectId }: StrategyTabProps) {
  const { data, isLoading, error } = useProjectStrategy(projectId);
  const strategy = data?.content as StrategyModel | undefined;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !strategy) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load strategy</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Doctrine */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-4">Strategic Doctrine</h2>
        <ul className="space-y-2">
          {strategy.doctrine.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-primary mt-1">•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Campaign Pillars */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-4">Campaign Pillars</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {strategy.campaign_pillars.map((pillar, i) => (
            <div key={i} className="p-4 rounded-lg bg-muted/50 border border-border">
              <h3 className="font-medium text-primary mb-2">{pillar.title}</h3>
              <p className="text-sm mb-3">{pillar.core_message}</p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p><span className="font-medium">Value:</span> {pillar.value_proposition}</p>
                <p><span className="font-medium">Position:</span> {pillar.positioning_note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-4">Key Performance Indicators</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 font-medium">Metric</th>
                <th className="text-left py-2 font-medium">Description</th>
                <th className="text-left py-2 font-medium">Target</th>
                <th className="text-left py-2 font-medium">Timeframe</th>
              </tr>
            </thead>
            <tbody>
              {strategy.kpis.map((kpi, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 font-medium">{kpi.metric}</td>
                  <td className="py-2 text-muted-foreground">{kpi.description}</td>
                  <td className="py-2 text-primary">{kpi.target}</td>
                  <td className="py-2 text-muted-foreground">{kpi.timeframe}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audience Mapping */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-4">Audience Mapping</h2>
        
        {/* Segments */}
        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-2">Segments</p>
          <div className="flex flex-wrap gap-2">
            {strategy.audience_mapping.segments.map((segment, i) => (
              <span key={i} className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">
                {segment}
              </span>
            ))}
          </div>
        </div>

        {/* Personas */}
        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-3">Personas</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategy.audience_mapping.personas.map((persona, i) => (
              <div key={i} className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">{persona.name}</h4>
                <p className="text-sm text-muted-foreground mb-3">{persona.description}</p>
                <div className="flex flex-wrap gap-1">
                  {persona.channels.map((channel, j) => (
                    <span key={j} className="text-xs px-2 py-0.5 rounded bg-muted">
                      {channel}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Journey Map */}
        <div>
          <p className="text-xs text-muted-foreground mb-3">Customer Journey</p>
          <div className="flex flex-col md:flex-row gap-2 md:gap-0">
            {['awareness', 'consideration', 'conversion', 'loyalty'].map((stage, i) => (
              <div key={stage} className="flex-1 flex items-center">
                <div className="flex-1 p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs font-medium text-primary capitalize mb-1">{stage}</p>
                  <p className="text-xs text-muted-foreground">
                    {strategy.audience_mapping.journey_mapping[stage as keyof typeof strategy.audience_mapping.journey_mapping]}
                  </p>
                </div>
                {i < 3 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-2 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Channel Strategy */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-4">Channel Strategy</h2>
        
        {/* Channels */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {strategy.channel_strategy.channels.map((channel, i) => (
            <div key={i} className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{channel.name}</h4>
                {channel.budget_share && (
                  <span className="text-xs text-primary">{channel.budget_share}%</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2">{channel.role}</p>
              <div className="flex flex-wrap gap-1">
                {channel.content_types.map((type, j) => (
                  <span key={j} className="text-xs px-2 py-0.5 rounded bg-muted">
                    {type}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Content Calendar */}
        {strategy.channel_strategy.content_calendar.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-3">Content Calendar</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium">Phase/Date</th>
                    <th className="text-left py-2 font-medium">Channel</th>
                    <th className="text-left py-2 font-medium">Content Type</th>
                    <th className="text-left py-2 font-medium">Pillar</th>
                  </tr>
                </thead>
                <tbody>
                  {strategy.channel_strategy.content_calendar.map((item, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2">{item.date_or_phase}</td>
                      <td className="py-2">{item.channel}</td>
                      <td className="py-2">{item.content_type}</td>
                      <td className="py-2 text-primary">{item.pillar}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
