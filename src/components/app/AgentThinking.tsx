import { useState } from "react";
import { Brain, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentThinkingProps {
  text: string;
}

/**
 * The agent's reasoning, collapsed by default.
 *
 * Worth showing — it explains why an answer took a while — but it is not the
 * answer, so it stays out of the way until someone opens it.
 */
export function AgentThinking({ text }: AgentThinkingProps) {
  const [open, setOpen] = useState(false);
  if (!text.trim()) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/30">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground hover:text-foreground"
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        )}
        <Brain className="h-3.5 w-3.5 shrink-0" />
        <span>{open ? "Hide thinking" : "Thinking"}</span>
      </button>
      {open && (
        <p
          className={cn(
            "max-h-56 overflow-y-auto whitespace-pre-wrap px-3 pb-3",
            "text-xs leading-relaxed text-muted-foreground"
          )}
        >
          {text}
        </p>
      )}
    </div>
  );
}
