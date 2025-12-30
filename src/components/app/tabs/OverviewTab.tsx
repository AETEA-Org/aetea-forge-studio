import { Loader2 } from "lucide-react";
import { useProjectOverview } from "@/hooks/useProjectSection";
import type { OverviewModel } from "@/types/api";

interface OverviewTabProps {
  projectId: string;
}

export function OverviewTab({ projectId }: OverviewTabProps) {
  const { data, isLoading, error } = useProjectOverview(projectId);
  const overview = data?.content as OverviewModel | undefined;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load overview</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Campaign Summary */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-3">Campaign Summary</h2>
        <p className="text-muted-foreground leading-relaxed">{overview.campaign_summary}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Goals & Success */}
        <div className="glass rounded-xl p-6">
          <h2 className="font-semibold mb-3">Goals & Success</h2>
          <ul className="space-y-2">
            {overview.goals_and_success.map((goal, i) => (
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
              {overview.brand_snapshot.brand_voice_tags.map((tag, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Colors</p>
            <div className="flex gap-2">
              {overview.brand_snapshot.color_palette.map((color, i) => (
                <div key={i} className="flex items-center gap-2" title={color.name}>
                  <div 
                    className="w-6 h-6 rounded-full border border-border"
                    style={{ backgroundColor: color.hex_code }}
                  />
                  <span className="text-xs text-muted-foreground">{color.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Typography</p>
            <p className="text-sm">{overview.brand_snapshot.typography.join(', ')}</p>
          </div>
        </div>
      </div>

      {/* Strategy Highlights */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-3">Strategy Highlights</h2>
        <ul className="space-y-2 mb-4">
          {overview.strategy_highlights.bullet_points.map((point, i) => (
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
              {overview.strategy_highlights.main_platforms.map((platform, i) => (
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
