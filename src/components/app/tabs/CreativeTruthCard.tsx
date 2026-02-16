import { Sparkles, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CreativeState } from "@/types/api";

interface CreativeTruthCardProps {
  flipped: boolean;
  onFlip: () => void;
  data: CreativeState['creative_truth'] | undefined;
}

export function CreativeTruthCard({ flipped, onFlip, data }: CreativeTruthCardProps) {
  return (
    <div className="relative h-full min-h-[280px] perspective-1000">
      <div
        className={cn(
          "relative w-full h-full transition-transform duration-500 preserve-3d",
          flipped && "rotate-y-180"
        )}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front Side - title, icon, flip indicator; hover indicates interactivity */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full backface-hidden rounded-lg border border-border bg-card p-6 flex flex-col items-center justify-center cursor-pointer",
            "hover:shadow-lg hover:border-primary/30 transition-all duration-300",
            !flipped ? "z-10" : "z-0"
          )}
          onClick={onFlip}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <Sparkles className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Creative Truth</h3>
          <p className="text-sm text-muted-foreground">Click to view</p>
        </div>

        {/* Back Side */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full backface-hidden rounded-lg border border-border bg-card p-6 overflow-y-auto",
            flipped ? "z-10 rotate-y-180" : "z-0"
          )}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold">Creative Truth</h3>
            <button
              onClick={onFlip}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              title="Flip back"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Claims/RTBs Section */}
            <div>
              <h4 className="text-sm font-medium mb-3">Claims/RTBs</h4>
              {data?.claims_rtbs && data.claims_rtbs.length > 0 ? (
                <ul className="space-y-2">
                  {data.claims_rtbs.map((claim, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{claim}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No claims/RTBs available</p>
              )}
            </div>

            {/* CTAs/Specs Section */}
            <div>
              <h4 className="text-sm font-medium mb-3">CTAs/Specs</h4>
              {data?.ctas_specs && data.ctas_specs.length > 0 ? (
                <ul className="space-y-2">
                  {data.ctas_specs.map((cta, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{cta}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No CTAs/Specs available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
