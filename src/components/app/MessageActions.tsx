import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { copyMarkdown } from "@/lib/clipboard";
import {
  formatDistanceCompactFromUTC,
  formatDistanceFromUTC,
} from "@/lib/dateUtils";
// The module-level `toast`, not `useToast()`: the hook subscribes a
// listener per caller and re-subscribes on every toast state change, and
// this component renders once per message. Nothing here reads toast state.
import { toast } from "@/hooks/use-toast";
import type { ChatAssetSurface } from "@/components/app/ChatMessageAssets";

/** How long the tick stays before the icon goes back to being a copy button. */
const COPIED_MS = 1500;

const BUTTON = cn(
  // No opacity utility here on purpose: the resting and revealed states are
  // set by the `.message-action` rules in index.css, and a Tailwind utility
  // would outrank them from a later cascade layer.
  "message-action flex h-5 w-5 shrink-0 items-center justify-center rounded p-0",
  "text-muted-foreground transition-opacity",
  "hover:bg-muted hover:text-foreground",
  "focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
);

/**
 * The row under every message: copy, rewind, and when it was said.
 *
 * It replaces the meta row `ChatMessages` used to build inline, so the two
 * controls share one hover rule, one focus ring and one size on all three chat
 * surfaces. The row already existed to hold the timestamp, which is why adding
 * the buttons costs no height — the campaign panel and a 320px canvas node have
 * no room to spare.
 */
export function MessageActions({
  content,
  timestamp,
  canRewind = false,
  onRewind,
  isRewinding = false,
  surface = "wide",
}: {
  /** The raw markdown of the message. Empty means there is nothing to copy. */
  content: string;
  timestamp: string;
  canRewind?: boolean;
  onRewind?: () => void;
  /** True while this is the message the composer is rewinding to. */
  isRewinding?: boolean;
  surface?: ChatAssetSurface;
}) {
  const [copied, setCopied] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Switching chats mid-flash would otherwise set state on a gone component.
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleCopy = useCallback(async () => {
    const ok = await copyMarkdown(content);
    if (!ok) {
      toast({
        title: "Couldn't copy",
        description: "Your browser blocked clipboard access.",
        variant: "destructive",
      });
      return;
    }
    setCopied(true);
    setAnnouncement("Message copied");
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCopied(false);
      setAnnouncement("");
    }, COPIED_MS);
  }, [content]);

  const hasText = Boolean(content?.trim());

  return (
    <div className="flex min-w-0 items-center gap-1 px-1">
      {hasText ? (
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy message"}
          title={copied ? "Copied" : "Copy message"}
          // Keep the tick visible through its whole flash, even once the
          // pointer has left the message.
          data-state={copied ? "active" : undefined}
          className={cn(BUTTON, copied && "text-green-600 opacity-100 dark:text-green-400")}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </button>
      ) : null}

      {canRewind && onRewind ? (
        <button
          type="button"
          onClick={onRewind}
          aria-label="Rewind to this message"
          title="Rewind to here"
          data-state={isRewinding ? "active" : undefined}
          className={cn(BUTTON, isRewinding && "text-primary opacity-100")}
        >
          <Undo2 className="h-3 w-3" />
        </button>
      ) : null}

      <span className="min-w-0 truncate text-xs text-muted-foreground">
        {surface === "canvas"
          ? formatDistanceCompactFromUTC(timestamp)
          : formatDistanceFromUTC(timestamp, { addSuffix: true })}
      </span>

      {/* The icon swap is invisible to a screen reader on its own. */}
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
