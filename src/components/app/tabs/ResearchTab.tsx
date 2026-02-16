import { Loader2, ExternalLink, Instagram, Twitter, Facebook, Linkedin, Youtube } from "lucide-react";
import { useCampaignResearch } from "@/hooks/useProjectSection";
import { Markdown } from "@/components/ui/markdown";
import { ModificationOverlay } from "@/components/app/ModificationOverlay";
import type { ResearchModel } from "@/types/api";
import { cn } from "@/lib/utils";

interface ResearchTabProps {
  projectId: string;
  isModifying?: boolean;
}

export function ResearchTab({ projectId, isModifying }: ResearchTabProps) {
  const { data, isLoading, error } = useCampaignResearch(projectId);
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

  // Helper function to detect social media platform from URL
  const getSocialIcon = (url: string) => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('instagram.com')) return Instagram;
    if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return Twitter;
    if (lowerUrl.includes('facebook.com')) return Facebook;
    if (lowerUrl.includes('linkedin.com')) return Linkedin;
    if (lowerUrl.includes('youtube.com')) return Youtube;
    if (lowerUrl.includes('tiktok.com')) return ExternalLink; // TikTok icon not in lucide-react
    return ExternalLink;
  };

  const getSocialLabel = (url: string) => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('instagram.com')) return 'Instagram';
    if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return 'Twitter/X';
    if (lowerUrl.includes('facebook.com')) return 'Facebook';
    if (lowerUrl.includes('linkedin.com')) return 'LinkedIn';
    if (lowerUrl.includes('youtube.com')) return 'YouTube';
    if (lowerUrl.includes('tiktok.com')) return 'TikTok';
    return 'Social';
  };

  return (
    <div className="relative space-y-6">
      <ModificationOverlay isActive={isModifying || false} />
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
            <Markdown className="text-sm">{research.audience_culture.demographics}</Markdown>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Psychographics</p>
            <Markdown className="text-sm">{research.audience_culture.psychographics}</Markdown>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Behaviour Patterns</p>
            <Markdown className="text-sm">{research.audience_culture.behaviour_patterns}</Markdown>
          </div>
        </div>
      </div>

      {/* Competitors & Positioning */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-4">Competitors & Positioning</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {competitors.map((comp, i) => {
            const hasHomepage = comp.homepage_url && comp.homepage_url.trim() !== '';
            const hasSocialHandles = comp.social_handles && comp.social_handles.length > 0;
            
            return (
              <div key={i} className="p-4 rounded-lg bg-muted/50 border-l-2 border-primary">
                <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium mb-3">
                  {comp.competitor_type}
                </span>
                <h3 className="font-medium text-lg mb-2">{comp.name}</h3>
                <Markdown className="text-sm text-muted-foreground mb-2">{comp.one_line_summary}</Markdown>
                <Markdown className="text-xs text-muted-foreground italic mb-3">{comp.perceived_positioning}</Markdown>
                
                {/* Homepage URL */}
                {hasHomepage && (
                  <div className="mb-2">
                    <a
                      href={comp.homepage_url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Visit Website</span>
                    </a>
                  </div>
                )}
                
                {/* Social Handles */}
                {hasSocialHandles && (
                  <div className="flex flex-wrap items-center gap-2">
                    {comp.social_handles.map((url, j) => {
                      const Icon = getSocialIcon(url);
                      const label = getSocialLabel(url);
                      return (
                        <a
                          key={j}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "inline-flex items-center gap-1.5 p-1.5 rounded",
                            "text-muted-foreground hover:text-primary hover:bg-primary/10",
                            "transition-colors"
                          )}
                          title={label}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
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
