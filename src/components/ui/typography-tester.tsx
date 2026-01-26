import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { getFontFamily, loadFonts } from "@/lib/fontUtils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface TypographyTesterProps {
  fonts: string[];
}

export function TypographyTester({ fonts }: TypographyTesterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [testText, setTestText] = useState("");

  // Load fonts when tester is opened
  useEffect(() => {
    if (isOpen && fonts.length > 0) {
      loadFonts(fonts).catch(() => {
        // Silently handle errors - fonts will fallback to system fonts
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
                {fonts.map((font, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground mb-1.5 font-medium">
                      {font}
                    </p>
                    <p
                      className="text-sm leading-relaxed"
                      style={{
                        fontFamily: getFontFamily(font),
                      }}
                    >
                      {testText}
                    </p>
                  </div>
                ))}
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
