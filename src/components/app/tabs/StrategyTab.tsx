import { Loader2, ArrowRight } from "lucide-react";
import { useCampaignStrategy } from "@/hooks/useProjectSection";
import { Markdown } from "@/components/ui/markdown";
import { ModificationOverlay } from "@/components/app/ModificationOverlay";
import type { StrategyModel } from "@/types/api";

interface StrategyTabProps {
  projectId: string;
  isModifying?: boolean;
}

export function StrategyTab({ projectId, isModifying }: StrategyTabProps) {
  const { data, isLoading, error } = useCampaignStrategy(projectId);
  const strategy = data?.content as StrategyModel | undefined;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    console.error('Strategy load error:', error);
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load strategy</p>
        <p className="text-sm text-muted-foreground mt-2">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No strategy data available</p>
      </div>
    );
  }

  // Validate critical data structure
  if (!strategy.doctrine || !strategy.campaign_pillars || !strategy.audience_mapping || !strategy.channel_strategy) {
    console.error('Invalid strategy structure:', strategy);
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Invalid strategy data format</p>
      </div>
    );
  }

  // Safe accessors with defaults
  const doctrine = strategy.doctrine || [];
  const pillars = strategy.campaign_pillars || [];
  const kpis = strategy.kpis || [];
  const segments = strategy.audience_mapping?.segments || [];
  const personas = strategy.audience_mapping?.personas || [];
  const channels = strategy.channel_strategy?.channels || [];
  const contentCalendar = strategy.channel_strategy?.content_calendar || [];

  return (
    <div className="relative space-y-6">
      <ModificationOverlay isActive={isModifying || false} />
      
      {/* 1. Audience Mapping */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-4">Audience Mapping</h2>
        
        {/* Segments */}
        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-2">Segments</p>
          <div className="flex flex-wrap gap-2">
            {segments.map((segment, i) => (
              <span key={i} className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">
                {typeof segment === 'string' ? segment : JSON.stringify(segment)}
              </span>
            ))}
          </div>
        </div>

        {/* Personas */}
        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-3">Personas</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personas.map((persona, i) => (
              <div key={i} className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">{persona.name}</h4>
                <Markdown className="text-sm text-muted-foreground mb-3">
                  {typeof persona.description === 'string' ? persona.description : ''}
                </Markdown>
                <div className="flex flex-wrap gap-1">
                  {persona.channels?.map((channel, j) => (
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

      {/* 2. Insight */}
      {strategy.insight && (
        <div className="glass rounded-xl p-6 border-l-4 border-primary/50 bg-primary/5">
          <h2 className="font-semibold mb-4 text-primary">Insight</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                Core Cultural Insight
              </h3>
              <Markdown className="text-sm leading-relaxed">
                {strategy.insight.core_cultural_insight}
              </Markdown>
            </div>
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                Emotional & Behavioral Tension
              </h3>
              <Markdown className="text-sm leading-relaxed">
                {strategy.insight.emotional_behavioral_tension}
              </Markdown>
            </div>
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                Resolution: Alignment Over Performance
              </h3>
              <Markdown className="text-sm leading-relaxed">
                {strategy.insight.resolution_alignment_over_performance}
              </Markdown>
            </div>
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                Brand Role
              </h3>
              <Markdown className="text-sm leading-relaxed">
                {strategy.insight.brand_role}
              </Markdown>
            </div>
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                Single-Minded Proposition
              </h3>
              <Markdown className="text-sm leading-relaxed">
                {strategy.insight.single_minded_proposition}
              </Markdown>
            </div>
          </div>
        </div>
      )}

      {/* 3. Creative Foundation */}
      {strategy.creative_foundation && (
        <div className="glass rounded-xl p-6 border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
          <h2 className="font-semibold mb-3 text-primary">Creative Foundation</h2>
          <div className="text-2xl md:text-3xl font-bold text-primary tracking-tight mb-3">
            <Markdown className="leading-tight">{strategy.creative_foundation.foundation}</Markdown>
          </div>
          <div className="text-sm text-muted-foreground leading-relaxed">
            <Markdown>{strategy.creative_foundation.rationale}</Markdown>
          </div>
        </div>
      )}

      {/* 4. Strategic Doctrine */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-4">Strategic Doctrine</h2>
        <ul className="space-y-2">
          {doctrine.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-primary mt-1 shrink-0">•</span>
              <Markdown className="flex-1">{item}</Markdown>
            </li>
          ))}
        </ul>
      </div>

      {/* 5. Campaign Pillars */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-4">Campaign Pillars</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pillars.map((pillar, i) => (
            <div key={i} className="p-4 rounded-lg bg-muted/50 border border-border">
              <h3 className="font-medium text-primary mb-2">{pillar.title}</h3>
              <Markdown className="text-sm mb-3">{pillar.core_message}</Markdown>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">Value:</span> <Markdown inline>{pillar.value_proposition}</Markdown>
                </div>
                <div>
                  <span className="font-medium">Position:</span> <Markdown inline>{pillar.positioning_note}</Markdown>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Key Performance Indicators */}
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
              {kpis.map((kpi, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 font-medium">{kpi.metric}</td>
                  <td className="py-2 text-muted-foreground">
                    <Markdown className="text-sm">{kpi.description}</Markdown>
                  </td>
                  <td className="py-2 text-primary">{kpi.target}</td>
                  <td className="py-2 text-muted-foreground">{kpi.timeframe}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Channel Strategy */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-4">Channel Strategy</h2>
        
        {/* Channels */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {channels.map((channel, i) => (
            <div key={i} className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{channel.name}</h4>
                {channel.budget_share && (
                  <span className="text-xs text-primary">
                    {Math.round(channel.budget_share * 100)}%
                  </span>
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
        {contentCalendar.length > 0 && (
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
                  {contentCalendar.map((item, i) => (
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
