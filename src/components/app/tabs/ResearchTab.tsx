import { Loader2 } from "lucide-react";
import { useProjectResearch } from "@/hooks/useProjectSection";
import { Markdown } from "@/components/ui/markdown";
import type { ResearchModel } from "@/types/api";

interface ResearchTabProps {
  projectId: string;
}

export function ResearchTab({ projectId }: ResearchTabProps) {
  const { data, isLoading, error } = useProjectResearch(projectId);
  const research = data?.content as ResearchModel | undefined;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    console.error('Research load error:', error);
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load research</p>
        <p className="text-sm text-muted-foreground mt-2">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  if (!research) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No research data available</p>
      </div>
    );
  }

  // Validate critical data structure
  if (!research.market_category || !research.audience_culture || !research.competitors_positioning || !research.swot) {
    console.error('Invalid research structure:', research);
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Invalid research data format</p>
      </div>
    );
  }

  // Safe accessors with defaults
  const industryTrends = research.market_category?.industry_trends || [];
  const consumerInsights = research.market_category?.consumer_insights || [];
  const competitors = research.competitors_positioning?.competitors || [];
  const gapAnalysis = research.competitors_positioning?.gap_analysis || [];
  const strengths = research.swot?.strengths || [];
  const weaknesses = research.swot?.weaknesses || [];
  const opportunities = research.swot?.opportunities || [];
  const threats = research.swot?.threats || [];

  return (
    <div className="space-y-6">
      {/* Market & Category */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-4">Market & Category</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Industry Trends</p>
            <ul className="space-y-2">
              {industryTrends.map((trend, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-1 shrink-0">•</span>
                  <Markdown className="flex-1">{trend}</Markdown>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Market Context</p>
            <Markdown className="text-sm text-muted-foreground">{research.market_category.market_context}</Markdown>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Consumer Insights</p>
            <ul className="space-y-2">
              {consumerInsights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-1 shrink-0">•</span>
                  <Markdown className="flex-1">{insight}</Markdown>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Audience & Culture */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-4">Audience & Culture</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Demographics</p>
            <p className="text-sm">{research.audience_culture.demographics}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Psychographics</p>
            <p className="text-sm">{research.audience_culture.psychographics}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Behaviour Patterns</p>
            <p className="text-sm">{research.audience_culture.behaviour_patterns}</p>
          </div>
        </div>
      </div>

      {/* Competitors & Positioning */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-4">Competitors & Positioning</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {competitors.map((comp, i) => (
            <div key={i} className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{comp.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-muted">{comp.competitor_type}</span>
              </div>
              <Markdown className="text-sm text-muted-foreground mb-2">{comp.one_line_summary}</Markdown>
              <Markdown className="text-xs text-muted-foreground italic">{comp.perceived_positioning}</Markdown>
            </div>
          ))}
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Gap Analysis</p>
          <ul className="space-y-2">
            {gapAnalysis.map((gap, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary mt-1 shrink-0">•</span>
                <Markdown className="flex-1">{gap}</Markdown>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* SWOT */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-4">SWOT Analysis</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <h3 className="font-medium text-green-500 mb-3">Strengths</h3>
            <ul className="space-y-2">
              {strengths.map((item, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-green-500 mt-1 shrink-0">+</span>
                  <Markdown className="flex-1">{item}</Markdown>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <h3 className="font-medium text-red-500 mb-3">Weaknesses</h3>
            <ul className="space-y-2">
              {weaknesses.map((item, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-red-500 mt-1 shrink-0">−</span>
                  <Markdown className="flex-1">{item}</Markdown>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <h3 className="font-medium text-blue-500 mb-3">Opportunities</h3>
            <ul className="space-y-2">
              {opportunities.map((item, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-blue-500 mt-1 shrink-0">↑</span>
                  <Markdown className="flex-1">{item}</Markdown>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <h3 className="font-medium text-orange-500 mb-3">Threats</h3>
            <ul className="space-y-2">
              {threats.map((item, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-orange-500 mt-1 shrink-0">!</span>
                  <Markdown className="flex-1">{item}</Markdown>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
