import { Loader2 } from "lucide-react";
import { useProjectOverview } from "@/hooks/useProjectSection";
import { Markdown } from "@/components/ui/markdown";
import type { OverviewModel } from "@/types/api";

interface OverviewTabProps {
  projectId: string;
}

export function OverviewTab({ projectId }: OverviewTabProps) {
  const { data, isLoading, error } = useProjectOverview(projectId);
  const overview = data?.content as OverviewModel | undefined;

  // DEBUG: Log the actual data structure
  console.log('OverviewTab DEBUG:', {
    projectId,
    isLoading,
    error,
    hasData: !!data,
    data: data,
    overview: overview,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    console.error('Overview load error:', error);
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load overview</p>
        <p className="text-sm text-muted-foreground mt-2">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No overview data available</p>
      </div>
    );
  }

  // Validate critical data structure
  if (!overview.brand_snapshot || !overview.strategy_highlights || !overview.execution_snapshot) {
    console.error('Invalid overview structure:', overview);
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Invalid overview data format</p>
        <p className="text-sm text-muted-foreground mt-2">
          The project data is missing required sections.
        </p>
      </div>
    );
  }

  // Safe accessors with defaults to prevent crashes
  const goals = overview.goals_and_success || [];
  const voiceTags = overview.brand_snapshot?.brand_voice_tags || [];
  const colors = overview.brand_snapshot?.color_palette || [];
  const typography = overview.brand_snapshot?.typography || [];
  const bulletPoints = overview.strategy_highlights?.bullet_points || [];
  const platforms = overview.strategy_highlights?.main_platforms || [];

  return (
    <div className="space-y-6">
      {/* Campaign Summary */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-3">Campaign Summary</h2>
        <Markdown className="text-muted-foreground leading-relaxed">{overview.campaign_summary}</Markdown>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Goals & Success */}
        <div className="glass rounded-xl p-6">
          <h2 className="font-semibold mb-3">Goals & Success</h2>
          <ul className="space-y-2">
            {goals.map((goal, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary mt-1">•</span>
                {goal}
              </li>
            ))}
          </ul>
        </div>

        {/* Brand Snapshot */}
        <div className="glass rounded-xl p-6">
          <h2 className="font-semibold mb-3">Brand Snapshot</h2>
          
          {/* Voice Tags */}
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Voice</p>
            <div className="flex flex-wrap gap-2">
              {voiceTags.map((tag, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Colors</p>
            <div className="flex flex-wrap gap-3">
              {colors.map((color, i) => (
                <div key={i} className="text-center">
                  <div 
                    className="w-16 h-16 rounded-lg border border-border mb-2"
                    style={{ backgroundColor: color.hex_code }}
                  />
                  <p className="text-xs font-medium">{color.name}</p>
                  <p className="text-xs text-muted-foreground">{color.hex_code}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Typography</p>
            <p className="text-sm">{typography.join(', ')}</p>
          </div>
        </div>
      </div>

      {/* Strategy Highlights */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-3">Strategy Highlights</h2>
        <ul className="space-y-2 mb-4">
          {bulletPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-primary mt-1">•</span>
              {point}
            </li>
          ))}
        </ul>
        
        <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Platforms</p>
            <div className="flex flex-wrap gap-1">
              {platforms.map((platform, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded bg-muted">
                  {platform}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Timeline</p>
            <p className="text-sm">{overview.strategy_highlights.timeline}</p>
          </div>
        </div>
      </div>

      {/* Execution Snapshot */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-3">Execution Snapshot</h2>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{overview.execution_snapshot.completion_percentage.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${overview.execution_snapshot.completion_percentage}%` }}
            />
          </div>
        </div>

        {/* Task Counts */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{overview.execution_snapshot.total_tasks}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{overview.execution_snapshot.todo_count}</p>
            <p className="text-xs text-muted-foreground">To Do</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{overview.execution_snapshot.in_progress_count}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{overview.execution_snapshot.under_review_count}</p>
            <p className="text-xs text-muted-foreground">Review</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-primary">{overview.execution_snapshot.done_count}</p>
            <p className="text-xs text-muted-foreground">Done</p>
          </div>
        </div>
      </div>
    </div>
  );
}
