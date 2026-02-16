import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GenerateKeyVisualButtonProps {
  disabled: boolean;
  onClick: () => void;
  isGenerating: boolean;
}

export function GenerateKeyVisualButton({
  disabled,
  onClick,
  isGenerating,
}: GenerateKeyVisualButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isGenerating}
      size="lg"
      className={cn(
        "w-full gap-2",
        isGenerating && "cursor-not-allowed"
      )}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="h-5 w-5" />
          Generate Key Visual
        </>
      )}
    </Button>
  );
}
