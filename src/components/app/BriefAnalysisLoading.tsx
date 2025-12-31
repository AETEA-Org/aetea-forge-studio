import { Sparkles, FileText, Search, TrendingUp, Target, CheckSquare, LayoutDashboard, Save } from "lucide-react";

interface BriefAnalysisLoadingProps {
  progress: string;
}

// Map progress messages to icons and progress percentages
const progressSteps: Record<string, { icon: typeof Sparkles; percentage: number }> = {
  'Starting brief analysis...': { icon: Sparkles, percentage: 5 },
  'Extracting text from files...': { icon: FileText, percentage: 15 },
  'Analyzing brief...': { icon: Search, percentage: 25 },
  'Conducting market research...': { icon: TrendingUp, percentage: 45 },
  'Generating campaign strategy...': { icon: Target, percentage: 65 },
  'Creating execution tasks...': { icon: CheckSquare, percentage: 80 },
  'Generating overview...': { icon: LayoutDashboard, percentage: 90 },
  'Saving project...': { icon: Save, percentage: 95 },
};

export function BriefAnalysisLoading({ progress }: BriefAnalysisLoadingProps) {
  // Find the matching step or default
  const currentStep = progressSteps[progress] || { icon: Sparkles, percentage: 50 };
  const Icon = currentStep.icon;

  return (
    <div className="min-h-full flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        {/* Animated Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Pulsing glow effect */}
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
            
            {/* Icon container */}
            <div className="relative w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center backdrop-blur-sm border border-primary/20">
              <Icon className="h-12 w-12 text-primary animate-pulse" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-3">
          Creating Your Project
        </h2>

        {/* Progress Message */}
        <p className="text-lg text-primary text-center mb-8 animate-pulse min-h-[1.75rem]">
          {progress || "Starting analysis..."}
        </p>

        {/* Progress Bar */}
        <div className="space-y-2 mb-6">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${currentStep.percentage}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {currentStep.percentage}% complete
          </p>
        </div>

        {/* Info Text */}
        <p className="text-sm text-muted-foreground text-center">
          This may take a few moments. We're analyzing your brief and generating comprehensive campaign insights.
        </p>
      </div>
    </div>
  );
}
