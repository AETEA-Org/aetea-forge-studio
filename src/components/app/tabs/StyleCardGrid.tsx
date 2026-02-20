import { useState, useEffect, useRef } from "react";
import { Loader2, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StyleCard } from "@/types/api";

interface StyleCardGridProps {
  selectedStyleId: string | null;
  onSelect: (styleId: string) => void;
  styleCards: StyleCard[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export function StyleCardGrid({
  selectedStyleId,
  onSelect,
  styleCards,
  isLoading,
  hasMore,
  onLoadMore,
}: StyleCardGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Handle scroll for pagination
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !hasMore || isLoading) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = grid;
      // Load more when user scrolls to 80% of content
      if (scrollTop + clientHeight >= scrollHeight * 0.8 && !isLoadingMore) {
        setIsLoadingMore(true);
        onLoadMore();
      }
    };

    grid.addEventListener('scroll', handleScroll);
    return () => grid.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoading, isLoadingMore, onLoadMore]);

  useEffect(() => {
    if (!isLoading) {
      setIsLoadingMore(false);
    }
  }, [isLoading]);

  if (isLoading && styleCards.length === 0) {
    return (
      <div
        className="max-h-[400px] overflow-hidden"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 120px))',
          gap: '16px',
          justifyContent: 'start',
        }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="w-[120px] h-[120px] rounded-lg border-2 border-border bg-muted animate-pulse shrink-0"
          />
        ))}
      </div>
    );
  }

  if (styleCards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">No style cards available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        ref={gridRef}
        className="max-h-[400px] overflow-y-auto custom-scrollbar flex flex-col gap-4"
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 120px))',
            gap: '16px',
            justifyContent: 'start',
          }}
        >
          {styleCards.map((card) => {
          const isSelected = selectedStyleId === card.id;

          return (
            <div key={card.id} className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => onSelect(card.id)}
                className={cn(
                  "relative w-[120px] h-[120px] shrink-0 rounded-lg border-2 overflow-hidden transition-all hover:scale-105 hover:shadow-md bg-card",
                  isSelected
                    ? "border-primary shadow-md ring-2 ring-primary/30"
                    : "border-border hover:border-primary/50"
                )}
                style={{ boxSizing: 'border-box' }}
              >
                {card.preview_url ? (
                  <img
                    src={card.preview_url}
                    alt={card.name}
                    className="w-full h-full object-cover block"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.className += ' bg-muted flex items-center justify-center';
                        parent.innerHTML = `<span class="text-xs text-muted-foreground">${card.name}</span>`;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">{card.name}</span>
                  </div>
                )}

                {isSelected && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="bg-primary rounded-full p-1.5">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </button>
              <span className="text-xs text-muted-foreground truncate w-full text-center px-0.5" title={card.name}>
                {card.name}
              </span>
            </div>
          );
        })}
        </div>

        {hasMore && (
          <div className="flex justify-center pb-2 shrink-0">
            <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsLoadingMore(true);
              onLoadMore();
            }}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            Load more
          </Button>
          </div>
        )}
      </div>
    </div>
  );
}
