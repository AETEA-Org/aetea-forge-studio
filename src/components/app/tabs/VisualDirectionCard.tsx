import { Image, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { StyleCardGrid } from "./StyleCardGrid";
import type { StyleCard } from "@/types/api";

interface VisualDirectionCardProps {
  flipped: boolean;
  onFlip: () => void;
  selectedStyleId: string | null;
  onStyleSelect: (styleId: string) => void;
  styleCards: StyleCard[];
  isLoadingStyleCards: boolean;
  hasMoreStyleCards: boolean;
  onLoadMoreStyleCards: () => void;
}

export function VisualDirectionCard({
  flipped,
  onFlip,
  selectedStyleId,
  onStyleSelect,
  styleCards,
  isLoadingStyleCards,
  hasMoreStyleCards,
  onLoadMoreStyleCards,
}: VisualDirectionCardProps) {
  return (
    <div className="relative h-full min-h-[600px] perspective-1000">
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
          <Image className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Visual Direction</h3>
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
          <div className="flex items-start justify-between mb-5 sticky top-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90 border-b border-border pb-3 z-20">
            <h3 className="text-lg font-semibold">Visual Direction</h3>
            <button
              onClick={onFlip}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              title="Flip back"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Style Card Grid Section */}
            <div>
              <h4 className="text-sm font-medium mb-4">Style Cards</h4>
              <StyleCardGrid
                selectedStyleId={selectedStyleId}
                onSelect={onStyleSelect}
                styleCards={styleCards}
                isLoading={isLoadingStyleCards}
                hasMore={hasMoreStyleCards}
                onLoadMore={onLoadMoreStyleCards}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
