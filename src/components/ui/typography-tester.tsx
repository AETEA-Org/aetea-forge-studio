import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { getFontFamily, loadFont } from "@/lib/fontUtils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface TypographyTesterProps {
  fonts: string[];
}

export function TypographyTester({ fonts }: TypographyTesterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [testText, setTestText] = useState("");
  const [failedFonts, setFailedFonts] = useState<Set<string>>(new Set());

  // Load fonts when tester is opened and track failures
  useEffect(() => {
    if (isOpen && fonts.length > 0) {
      const failed = new Set<string>();
      
      // Load fonts individually to track which ones fail
      Promise.allSettled(
        fonts.map(font =>
          loadFont(font).catch(() => {
            failed.add(font);
          })
        )
      ).then(() => {
        setFailedFonts(failed);
      });
    }
  }, [isOpen, fonts]);

  if (fonts.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full text-left hover:text-primary transition-colors"
      >
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
        <span className="text-xs font-medium text-muted-foreground">
          Test your copy in these fonts
        </span>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <Textarea
            placeholder="Paste your copy here to preview in suggested fonts..."
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="min-h-[100px] text-sm"
          />

          {testText && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground font-medium">
                Preview:
              </p>
              <div className="space-y-3">
                {fonts.map((font, i) => {
                  const hasError = failedFonts.has(font);
                  return (
                    <div
                      key={i}
                      className={cn(
                        "p-3 rounded-lg bg-muted/30 border border-border",
                        hasError && "opacity-70"
                      )}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <p className="text-xs text-muted-foreground font-medium">
                          {font}
                        </p>
                        {hasError && (
                          <AlertCircle
                            className="h-3 w-3 text-muted-foreground/60"
                            title={`Font "${font}" failed to load - showing fallback font`}
                            aria-label={`Font ${font} failed to load`}
                          />
                        )}
                      </div>
                      <p
                        className="text-sm leading-relaxed"
                        style={{
                          fontFamily: getFontFamily(font),
                        }}
                      >
                        {testText}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {testText && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTestText("")}
              className="text-xs"
            >
              Clear
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
