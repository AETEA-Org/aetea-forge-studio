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
 * The summary comes from the saved proposal, not transient reply text, so it
 * stays with the decision after a reload. Declining changes nothing at all — that
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
