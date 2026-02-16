import { MessageSquare, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CreativeState } from "@/types/api";

interface CreativeToneCardProps {
  flipped: boolean;
  onFlip: () => void;
  data: CreativeState['creative_tone'] | undefined;
}

export function CreativeToneCard({ flipped, onFlip, data }: CreativeToneCardProps) {
  return (
    <div className="relative h-full min-h-[280px] perspective-1000">
      <div
        className={cn(
          "relative w-full h-full transition-transform duration-500 preserve-3d",
          flipped && "rotate-y-180"
        )}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front Side - title, icon; hover indicates interactivity */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full backface-hidden rounded-lg border border-border bg-card p-6 flex flex-col items-center justify-center cursor-pointer",
            "hover:shadow-lg hover:border-primary/30 transition-all duration-300",
            !flipped ? "z-10" : "z-0"
          )}
          onClick={onFlip}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <MessageSquare className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Creative Tone & Voice</h3>
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
            <h3 className="text-lg font-semibold">Creative Tone & Voice</h3>
            <button
              onClick={onFlip}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              title="Flip back"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Concept Section */}
            <div>
              <h4 className="text-sm font-medium mb-3">Concept</h4>
              {data?.concept ? (
                <p className="text-sm text-muted-foreground leading-relaxed">{data.concept}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No concept available</p>
              )}
            </div>

            {/* Headline Sample Section */}
            <div>
              <h4 className="text-sm font-medium mb-3">Headline Sample</h4>
              {data?.headline_sample ? (
                <p className="text-sm font-semibold text-foreground">{data.headline_sample}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No headline sample available</p>
              )}
            </div>

            {/* Body Copy Sample Section */}
            <div>
              <h4 className="text-sm font-medium mb-3">Body Copy Sample</h4>
              {data?.body_copy_sample ? (
                <p className="text-sm text-muted-foreground leading-relaxed">{data.body_copy_sample}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No body copy sample available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
