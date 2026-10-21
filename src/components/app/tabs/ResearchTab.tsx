import { Loader2, ExternalLink } from "lucide-react";
import { useCampaignResearch } from "@/hooks/useCampaignSection";
import { Markdown } from "@/components/ui/markdown";
import { ClampBox } from "@/components/ui/clamp-box";
import { BrandIcon, platformOf, type Platform } from "@/components/ui/brand-icons";
import { ModificationOverlay } from "@/components/app/ModificationOverlay";
import type { Competitor, ResearchModel } from "@/types/api";

interface ResearchTabProps {
  campaignId: string;
  isModifying?: boolean;
}

/**
 * How tall a SWOT quadrant may be before its contents are cut.
 *
 * About twelve lines — two or three entries in full, given research writes
 * 300–700 character paragraphs rather than one-liners. The grid gives every
 * quadrant the same box, so this is what stops the tallest one setting the
 * height for all four.
 */
const QUADRANT_MAX_HEIGHT = 330;

/** `[4](https://…)` — how research records the source behind a claim. */
const CITATION = /\[(\d+)\]\((https?:\/\/[^)\s]+)\)/g;

interface Quadrant {
  key: "strengths" | "weaknesses" | "opportunities" | "threats";
  title: string;
  sign: string;
  /** Surface, border, heading, and the fade that has to match the surface. */
  box: string;
  accent: string;
  fade: string;
}

const QUADRANTS: Quadrant[] = [
  {
    key: "strengths", title: "Strengths", sign: "+",
    box: "bg-green-500/10 border-green-500/20",
    accent: "text-green-500", fade: "to-[#15241b] dark:to-[#15241b]",
  },
  {
    key: "weaknesses", title: "Weaknesses", sign: "−",
    box: "bg-red-500/10 border-red-500/20",
    accent: "text-red-500", fade: "to-[#241717] dark:to-[#241717]",
  },
  {
    key: "opportunities", title: "Opportunities", sign: "↑",
    box: "bg-blue-500/10 border-blue-500/20",
    accent: "text-blue-500", fade: "to-[#141f2b] dark:to-[#141f2b]",
  },
  {
    key: "threats", title: "Threats", sign: "!",
    box: "bg-orange-500/10 border-orange-500/20",
    accent: "text-orange-500", fade: "to-[#261d12] dark:to-[#261d12]",
  },
];

/**
 * Every source the research cites, numbered as the text numbers them.
 *
 * The citations are already numbered consistently across the section, so the
 * chip in a bullet and the row down here carry the same number and the link is
 * checkable. Walks the model generically rather than naming fields, so a new
 * field in the schema is listed without a change here.
 */
function collectSources(research: ResearchModel): [string, string][] {
  const found = new Map<string, string>();
  const walk = (value: unknown) => {
    if (typeof value === "string") {
      for (const [, number, url] of value.matchAll(CITATION)) {
        if (!found.has(number)) found.set(number, url);
      }
    } else if (Array.isArray(value)) {
      value.forEach(walk);
    } else if (value && typeof value === "object") {
      Object.values(value).forEach(walk);
    }
  };
  walk(research);
  return [...found.entries()].sort(([a], [b]) => Number(a) - Number(b));
}

/** One profile per platform. */
function uniquePlatforms(urls: string[]): [Platform, string][] {
  const seen = new Set<Platform>();
  const out: [Platform, string][] = [];
  for (const url of urls) {
    const platform = platformOf(url);
    if (seen.has(platform)) continue;
    seen.add(platform);
    out.push([platform, url]);
  }
  return out;
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <span className="mt-1 shrink-0 text-primary">•</span>
          <Markdown className="flex-1">{item}</Markdown>
        </li>
      ))}
    </ul>
  );
}

/**
 * One competitor.
 *
 * The name is the link. A separate "Visit Website" row said the same thing a
 * second time and cost a line on every card. Profiles are one per platform:
 * the 2026-10-06 build returned six handles for one competitor including two
 * different Instagram accounts, which rendered as two identical icons with
 * nothing to tell them apart.
 */
function CompetitorCard({ competitor }: { competitor: Competitor }) {
  const homepage = competitor.homepage_url?.trim();
  const profiles = uniquePlatforms(competitor.social_handles || []);

  return (
    <div className="rounded-lg border-l-2 border-primary bg-muted/50 p-4">
      {homepage ? (
        <a
          href={homepage}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-lg font-medium text-foreground hover:text-primary hover:underline"
        >
          {competitor.name}
          <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
        </a>
      ) : (
        <span className="text-lg font-medium text-foreground">{competitor.name}</span>
      )}
      <p className="mb-2 mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        {competitor.competitor_type}
      </p>
      <Markdown className="mb-2 text-sm text-muted-foreground">
        {competitor.one_line_summary}
      </Markdown>
      <Markdown className="mb-3 text-xs italic text-muted-foreground">
        {competitor.perceived_positioning}
      </Markdown>

      {profiles.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {profiles.map(([platform, url]) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title={platform}
              aria-label={platform}
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              <BrandIcon platform={platform} className="h-3.5 w-3.5" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function ResearchTab({ campaignId, isModifying }: ResearchTabProps) {
  const { data, isLoading, error } = useCampaignResearch(campaignId);
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
  const sources = collectSources(research);

  return (
    <div className="relative space-y-6">
      <ModificationOverlay isActive={isModifying || false} />

      {/* Market & Category */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-4">Market &amp; Category</h2>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Industry Trends</p>
            <Bullets items={industryTrends} />
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Market Context</p>
            <Markdown className="text-sm">{research.market_category.market_context}</Markdown>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Consumer Insights</p>
            <Bullets items={consumerInsights} />
          </div>
        </div>
      </div>

      {/* Audience & Culture */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-4">Audience &amp; Culture</h2>

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
        <h2 className="font-semibold mb-4">Competitors &amp; Positioning</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {competitors.map((competitor, i) => (
            <CompetitorCard key={i} competitor={competitor} />
          ))}
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Gap Analysis</p>
          <Bullets items={gapAnalysis} />
        </div>
      </div>

      {/* SWOT */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-4">SWOT Analysis</h2>

        <div className="grid md:grid-cols-2 gap-4">
          {QUADRANTS.map((quadrant) => {
            const items = research.swot?.[quadrant.key] || [];
            return (
              <div key={quadrant.key} className={`rounded-lg border p-4 ${quadrant.box}`}>
                <h3 className={`mb-3 font-medium ${quadrant.accent}`}>{quadrant.title}</h3>
                <ClampBox
                  maxHeight={QUADRANT_MAX_HEIGHT}
                  fadeClassName={quadrant.fade}
                  linkClassName={quadrant.accent}
                  indentClassName="ml-[18px]"
                >
                  <ul className="space-y-2">
                    {items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className={`mt-1 shrink-0 ${quadrant.accent}`}>{quadrant.sign}</span>
                        <Markdown className="flex-1">{item}</Markdown>
                      </li>
                    ))}
                  </ul>
                </ClampBox>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sources */}
      {sources.length > 0 && (
        <div className="glass rounded-xl p-6">
          <h2 className="font-semibold mb-4">Sources</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {sources.map(([number, url]) => (
              <li key={number} className="flex min-w-0 items-baseline gap-2 text-xs">
                <span className="shrink-0 rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
                  {number}
                </span>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-muted-foreground hover:text-primary hover:underline"
                  title={url}
                >
                  {url.replace(/^https?:\/\/(www\.)?/, "")}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
