import { useEffect, useRef, useState } from "react";
import { useCampaignProposal } from "@/hooks/useCampaignProposal";
import { Button } from "@/components/ui/button";

/** The decision on a campaign change, and nothing else.
 *
 *  This used to open a dialog listing every change. The list was built from the
 *  stored records, so it was accurate — and unreadable: `swot.threats: (2 items)
 *  → (3 items)` means nothing to a marketer, and `(3 items) → (3 items)` does
 *  not even say what changed.
 *
 *  AETEA supplies a plain-language summary with the proposal. It stays beside
 *  the decision, including after a reload, so the user can read what they are
 *  approving even when the tool was called before any reply text streamed. */
export function AgentDecision({ chatId, scope, onReady, ready = true }: { chatId?: string; scope?: string; onReady?: () => void; ready?: boolean }) {
  const { proposal, error, busy, refresh, decide } = useCampaignProposal(chatId, scope);
  const [dismissed, setDismissed] = useState<string | null>(null);
  useEffect(() => {
    try { setDismissed(localStorage.getItem(`aetea:decision-dismissed:${chatId}`)); } catch { /* Optional preference. */ }
  }, [chatId]);
  // After deciding, the composer should be where the cursor is — but only once
  // the turn it unblocked has finished, or focus lands and is taken away again.
  const focusWhenReady = useRef(false);
  useEffect(() => {
    if (ready && focusWhenReady.current) {
      focusWhenReady.current = false;
      requestAnimationFrame(() => onReady?.());
    }
  }, [ready, onReady]);

  if (!proposal && !error) return null;
  const status = proposal?.status ?? "pending";
  const pending = status === "pending";
  const dismissKey = `${proposal?.proposal_id}:${status}`;
  const dismissible = !!proposal && !["pending", "approved"].includes(status);
  if (dismissible && dismissed === dismissKey && !error) return null;

  const failed = proposal?.result?.failed ?? [];
  const applied = proposal?.result?.applied ?? [];
  const messages: Record<string, string> = {
    applied: failed.length
      ? (applied.length
          ? "Some of it went through. Ask AETEA what is still outstanding."
          : "That could not be confirmed. Ask AETEA to check the campaign.")
      : "Your campaign is updated.",
    declined: "Left as it is. Tell AETEA what you would prefer.",
    approved: "Making the changes…",
    conflict: "The campaign moved on while this was waiting, so nothing changed. Ask AETEA to look again.",
    expired: "This sat too long to use, so nothing changed. Ask AETEA to look again.",
    superseded: "A newer suggestion replaced this one.",
    missing: "This suggestion is no longer available.",
  };

  const act = async (choice: "approve" | "decline") => {
    focusWhenReady.current = true;
    await decide(choice);
  };

  return (
    <div className="nodrag nowheel min-w-0 shrink-0 px-3 pb-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
        {proposal?.summary && (
          <p className="w-full break-words text-sm text-muted-foreground">{proposal.summary}</p>
        )}
        <p className="min-w-0 flex-1 basis-32 text-xs" role="status">
          {pending ? "Your go-ahead is needed" : messages[status] ?? "Review what happened."}
        </p>
        {pending && (
          <div className="flex shrink-0 gap-2">
            <Button size="sm" className="min-h-11" disabled={busy} onClick={() => void act("approve")}>
              {busy ? "Saving…" : "Go ahead"}
            </Button>
            <Button size="sm" variant="outline" className="min-h-11" disabled={busy} onClick={() => void act("decline")}>
              Not quite right
            </Button>
          </div>
        )}
        {dismissible && (
          <Button variant="ghost" size="sm" className="min-h-11 shrink-0" onClick={() => {
            setDismissed(dismissKey);
            try { localStorage.setItem(`aetea:decision-dismissed:${chatId}`, dismissKey); } catch { /* Optional preference. */ }
          }}>Dismiss</Button>
        )}
        {!proposal && (
          <Button variant="ghost" size="sm" className="min-h-11 shrink-0" onClick={() => void refresh()}>Retry</Button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {error}{" "}
          <button className="min-h-11 underline" onClick={() => void refresh()}>Retry</button>
        </p>
      )}
    </div>
  );
}
