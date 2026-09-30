import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CampaignProposal } from "@/services/agentRun";

interface CampaignChangeProposalProps {
  proposal: CampaignProposal;
  onApprove: () => Promise<void>;
  onDecline: () => Promise<void>;
}

/**
 * A change AETEA wants to make to the campaign, waiting on the user.
 *
 * The lines come from the server, not from the reply text: the card shows what
 * the stored change would actually do, so approving cannot mean agreeing to
 * something other than what was read. Declining changes nothing at all — that
 * is the guarantee the whole flow exists for, so the button says so plainly
 * rather than hiding behind "Cancel".
 */
export function CampaignChangeProposal({
  proposal,
  onApprove,
  onDecline,
}: CampaignChangeProposalProps) {
  const [busy, setBusy] = useState<"approve" | "decline" | null>(null);

  const decide = (choice: "approve" | "decline", act: () => Promise<void>) => async () => {
    // Guarded rather than merely disabled: a double click on a slow connection
    // would otherwise send two decisions, and the second is the one that would
    // surprise them.
    if (busy) return;
    setBusy(choice);
    try {
      await act();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="mb-2 flex items-center gap-2">
        <ClipboardCheck className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Update the campaign?</span>
      </div>

      <p className="mb-3 text-sm text-muted-foreground">{proposal.summary}</p>

      {proposal.change_lines.length > 0 && (
        <ul className="mb-3 space-y-1 rounded-lg bg-background/60 p-3 text-xs text-muted-foreground">
          {proposal.change_lines.map((line, index) => (
            <li key={index} className="whitespace-pre-wrap break-words font-mono">
              {line}
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <Button size="sm" disabled={busy !== null} onClick={decide("approve", onApprove)}>
          {busy === "approve" ? "Applying…" : "Apply the change"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={busy !== null}
          onClick={decide("decline", onDecline)}
        >
          Leave it as it is
        </Button>
      </div>
    </div>
  );
}
