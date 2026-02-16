import { Loader2, Calendar, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { useCampaignBrief } from "@/hooks/useProjectSection";
import { ModificationOverlay } from "@/components/app/ModificationOverlay";
import { FontPreview } from "@/components/ui/font-preview";
import { TypographyTester } from "@/components/ui/typography-tester";
import { loadFonts } from "@/lib/fontUtils";
import type { BriefModel } from "@/types/api";

interface BriefTabProps {
  projectId: string;
  isModifying?: boolean;
}

export function BriefTab({ projectId, isModifying }: BriefTabProps) {
  const { data, isLoading, error } = useCampaignBrief(projectId);
  const brief = data?.content as BriefModel | undefined;

  // Safe accessor for typography (must be before early returns for hooks)
  const typographyList = brief?.brand_information?.typography || [];

  // Load fonts when typography is available (must be before early returns)
  useEffect(() => {
    if (typographyList.length > 0) {
      loadFonts(typographyList).catch(() => {
        // Silently handle errors - fonts will fallback to system fonts
      });
    }
  }, [typographyList]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    console.error('Brief load error:', error);
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load brief</p>
        <p className="text-sm text-muted-foreground mt-2">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No brief data available</p>
      </div>
    );
  }

  // Validate critical data structure
  if (!brief.campaign_goals || !brief.brand_information || !brief.project_brief) {
    console.error('Invalid brief structure:', brief);
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Invalid brief data format</p>
      </div>
    );
  }

  // Safe accessors with defaults
  const objectives = brief.campaign_goals?.campaign_objectives || [];
  const targetMetrics = brief.campaign_goals?.target_metrics || [];
  const voiceTags = brief.brand_information?.brand_voice_tags || [];
  const colors = brief.brand_information?.colors || [];
  const deliverables = brief.project_brief?.deliverables || [];
  const keyDates = brief.project_brief?.key_dates || [];
  const userHashtags = brief.hashtags?.hashtags_from_user || [];
  const aeteaHashtags = brief.hashtags?.hashtags_ai_recommended || [];
  const hasAnyHashtags = userHashtags.length > 0 || aeteaHashtags.length > 0;
  
  // typographyList is already declared above for the useEffect hook

  return (
    <div className="relative space-y-6">
      <ModificationOverlay isActive={isModifying || false} />
      {/* Campaign Goals */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-4">Campaign Goals</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Objectives</p>
            <ul className="space-y-2">
              {objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-1">•</span>
                  {obj}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Target Metrics</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium">Metric</th>
                    <th className="text-left py-2 font-medium">Target</th>
                    <th className="text-left py-2 font-medium">Timeframe</th>
                  </tr>
                </thead>
                <tbody>
                  {targetMetrics.map((metric, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2">{metric.metric}</td>
                      <td className="py-2 text-primary">{metric.target}</td>
                      <td className="py-2 text-muted-foreground">{metric.timeframe || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Success Criteria</p>
            <p className="text-sm">{brief.campaign_goals.success_criteria}</p>
          </div>
        </div>
      </div>

      {/* Hashtags */}
      {hasAnyHashtags && (
        <div className="glass rounded-xl p-6">
          <h2 className="font-semibold mb-4">Hashtags</h2>
          
          <div className="space-y-4">
            {/* User Hashtags */}
            {userHashtags.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">From Brief</p>
                <div className="flex flex-wrap gap-2">
                  {userHashtags.map((tag, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AETEA Recommended Hashtags */}
            {aeteaHashtags.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <p className="text-xs text-muted-foreground">AETEA Recommended</p>
                  <Sparkles className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {aeteaHashtags.map((tag, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-muted/50 text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Brand Information */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-4">Brand Information</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            {brief.brand_information.brand_name && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-1">Brand Name</p>
                <p className="font-medium">{brief.brand_information.brand_name}</p>
              </div>
            )}

            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Voice Tags</p>
              <div className="flex flex-wrap gap-2">
                {voiceTags.map((tag, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Style Guidelines</p>
              <p className="text-sm text-muted-foreground">{brief.brand_information.style_guidelines}</p>
            </div>
          </div>

          <div>
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Color Palette</p>
              <div className="flex flex-wrap gap-3">
                {colors.map((color, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-lg border border-border"
                      style={{ backgroundColor: color.hex_code }}
                    />
                    <div>
                      <p className="text-xs font-medium">{color.name}</p>
                      <p className="text-xs text-muted-foreground">{color.hex_code}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Typography</p>
              <div className="flex flex-wrap gap-2">
                {typographyList.map((font, i) => (
                  <FontPreview key={i} fontName={font} />
                ))}
              </div>
              <TypographyTester fonts={typographyList} />
            </div>
          </div>
        </div>
      </div>

      {/* Project Brief */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-4">Project Brief</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Deliverables</p>
            <ul className="grid md:grid-cols-2 gap-2">
              {deliverables.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-1">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {(brief.project_brief.start_date || brief.project_brief.end_date) && (
            <div className="flex gap-6">
              {brief.project_brief.start_date && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                  <p className="text-sm">{brief.project_brief.start_date}</p>
                </div>
              )}
              {brief.project_brief.end_date && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">End Date</p>
                  <p className="text-sm">{brief.project_brief.end_date}</p>
                </div>
              )}
            </div>
          )}

          {keyDates.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Key Dates</p>
              <div className="space-y-2">
                {keyDates.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground">{item.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {brief.project_brief.budget && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Budget</p>
              <p className="text-sm font-medium">{brief.project_brief.budget}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-muted-foreground mb-1">Constraints</p>
            <p className="text-sm text-muted-foreground">{brief.project_brief.constraints}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
