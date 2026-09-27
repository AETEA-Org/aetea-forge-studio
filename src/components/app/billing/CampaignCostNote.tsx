import { expectedFor, usePlan } from "@/hooks/useBilling";
import { formatCredits } from "./format";

/**
 * What a campaign build usually costs, before one is started.
 *
 * The campaign build is the most expensive thing in the product and the least
 * predictable, so it is exactly the action the pre-run figure exists for. It
 * shows a **range**, because that is the honest shape of the number: what a
 * build costs depends on how much research it needs, and a single figure would
 * read as a quote we then fail to honour.
 *
 * The figures are measured — `GET /billing/plan` computes them from real runs
 * per action **and tier**, so switching the picker moves them. Nothing here is
 * predicted or typed.
 *
 * It renders nothing until the meter has seen enough runs to mean anything.
 * Showing a placeholder would be worse than showing nothing: a customer cannot
 * tell an invented range from a measured one.
 */
const CAMPAIGN_BUILD = "campaign.build";

export function CampaignCostNote({ tier }: { tier: string }) {
  const { data } = usePlan();

  // `auto` is a choice about choosing and has no figures of its own. The router
  // resolves it per message, so the standard tier is the honest thing to quote.
  const resolved = tier === "auto" ? "aetea" : tier;
  const expected = expectedFor(data?.expected_costs, CAMPAIGN_BUILD, resolved);

  if (!expected) return null;

  return (
    <p className="text-xs text-muted-foreground">
      A campaign build usually uses{" "}
      <span className="font-medium text-foreground">
        {formatCredits(expected.typical_credits)}–
        {formatCredits(expected.high_credits)}
      </span>{" "}
      credits at this setting.
    </p>
  );
}
