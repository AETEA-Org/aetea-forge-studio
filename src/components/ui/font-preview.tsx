import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { loadFont, getFontFamily } from "@/lib/fontUtils";
import { cn } from "@/lib/utils";

interface FontPreviewProps {
  fontName: string;
  className?: string;
}

export function FontPreview({ fontName, className }: FontPreviewProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    loadFont(fontName)
      .then(() => {
        if (isMounted) {
          setIsLoaded(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasError(true);
          setIsLoaded(true); // Still show the font name even if loading failed
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fontName]);

  return (
    <span
      className={cn(
        "text-xs px-2 py-1 rounded bg-muted inline-flex items-center gap-1.5",
        hasError && "opacity-70",
        className
      )}
      style={{
        fontFamily: isLoaded ? getFontFamily(fontName) : undefined,
      }}
      title={hasError ? `Font "${fontName}" failed to load - showing fallback font` : fontName}
    >
      {fontName}
      {hasError && (
        <AlertCircle className="h-3 w-3 text-muted-foreground/60" aria-hidden="true" />
      )}
    </span>
  );
}
