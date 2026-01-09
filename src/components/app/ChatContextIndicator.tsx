import { Info } from "lucide-react";

interface ChatContextIndicatorProps {
  contextLabel: string;
  isTask?: boolean;
}

export function ChatContextIndicator({ contextLabel, isTask }: ChatContextIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50">
      <Info className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">
        Context: <span className="font-medium text-foreground">{contextLabel}</span>
      </span>
    </div>
  );
}
