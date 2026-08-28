import { useRef } from "react";
import { Sparkles, FileText, TrendingUp, Target, CheckSquare, Save } from "lucide-react";

interface BriefAnalysisLoadingProps {
  progress: string;
}

// Map progress messages to icons and progress percentages
const progressSteps: Record<string, { icon: typeof Sparkles; percentage: number }> = {
  'Analyzing your brief and documents': { icon: FileText, percentage: 15 },
  'Researching market, audience, and competitors': { icon: TrendingUp, percentage: 35 },
  'Developing campaign strategy': { icon: Target, percentage: 55 },
  'Planning creative tasks': { icon: CheckSquare, percentage: 75 },
  'Setting up creative direction': { icon: Sparkles, percentage: 90 },
  'Finalizing your campaign': { icon: Save, percentage: 95 },
};

const FIRST_STEP = { icon: FileText, percentage: 15 };

export function BriefAnalysisLoading({ progress }: BriefAnalysisLoadingProps) {
  // An unrecognised message used to fall back to 50%, so the bar opened near
  // halfway and then jumped *backwards* to 15% on the first real step. Start at
  // the first step instead, and never let the displayed value decrease.
  const step = progressSteps[progress] ?? FIRST_STEP;
  const highWaterMark = useRef(step.percentage);
  highWaterMark.current = Math.max(highWaterMark.current, step.percentage);

  const currentStep = { icon: step.icon, percentage: highWaterMark.current };
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
          Creating Your Campaign
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
