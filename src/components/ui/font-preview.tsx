import { useEffect, useState } from "react";
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
        "text-xs px-2 py-1 rounded bg-muted inline-block",
        className
      )}
      style={{
        fontFamily: isLoaded && !hasError ? getFontFamily(fontName) : undefined,
      }}
      title={hasError ? `Font "${fontName}" failed to load` : fontName}
    >
      {fontName}
    </span>
  );
}
