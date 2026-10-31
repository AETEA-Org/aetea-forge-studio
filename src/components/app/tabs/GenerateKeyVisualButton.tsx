import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface GenerateKeyVisualButtonProps {
  disabled: boolean;
  onClick: () => void;
  isGenerating: boolean;
  /**
   * Why the button is disabled, surfaced as a tooltip so a greyed-out button
   * does not just read as broken. Ignored while generating — the button says
   * "Generating..." for itself then.
   */
  disabledReason?: string;
}

export function GenerateKeyVisualButton({
  disabled,
  onClick,
  isGenerating,
  disabledReason,
}: GenerateKeyVisualButtonProps) {
  const button = (
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

  if (!disabledReason || !disabled || isGenerating) return button;

  return (
    <Tooltip>
      {/* A disabled button gets no pointer events and takes no focus, so the
          tooltip hangs off a wrapper instead. `block w-full` matches the
          button's own w-full, so nothing moves; tabIndex keeps the reason
          reachable by keyboard, with the same focus ring the button uses. */}
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className="block w-full rounded-md ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {button}
        </span>
      </TooltipTrigger>
      <TooltipContent>{disabledReason}</TooltipContent>
    </Tooltip>
  );
}
