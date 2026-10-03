import { useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CampaignModeOfferProps {
  rationale: string;
  onAccept: () => void | Promise<void>;
  onDecline: () => void | Promise<void>;
}

/**
 * The agent's offer to turn this conversation into a campaign.
 *
 * It proposes; the person decides. A campaign reshapes the workspace and is
 * not reversible, so it is never switched on automatically.
 */
export function CampaignModeOffer({
  rationale,
  onAccept,
  onDecline,
}: CampaignModeOfferProps) {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const act = async (action: () => void | Promise<void>) => {
    if (pending.current) return;
    pending.current = true; setBusy(true);
    try { await action(); } finally { pending.current = false; setBusy(false); }
  };
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Make this a campaign?</span>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">{rationale}</p>
      <div className="flex gap-2">
        <Button className="min-h-11" size="sm" disabled={busy} onClick={() => void act(onAccept)}>
          Switch to campaign
        </Button>
        <Button className="min-h-11" size="sm" variant="ghost" disabled={busy} onClick={() => void act(onDecline)}>
          Not now
        </Button>
      </div>
    </div>
  );
}
