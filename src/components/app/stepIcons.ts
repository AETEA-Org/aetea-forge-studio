import {
  CheckSquare,
  FileText,
  Image,
  Link2,
  Palette,
  Save,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

/**
 * An icon for a step the agent reported.
 *
 * The campaign build used to show a different icon per stage, and that was
 * dropped along with a percentage bar that guessed how far along it was. The
 * bar deserved to go; the icons did not.
 *
 * Keyed on `step_id` rather than on the label, because the id is what the
 * backend owns and keeps stable — `app/aetea/tools/campaign.py` publishes
 * `campaign`, `section-<key>`, `creative` and `tasks`, and the research and
 * generation tools publish `search`, `fetch`, `references` and `image`. Labels
 * are prose and get reworded.
 *
 * An unknown id is not a failure: it falls back to Sparkles, so a step added on
 * the server renders as generic work rather than as a stage that did not
 * happen. Nothing here implies progress — the step list alongside is the
 * truthful account of what has run.
 */
const EXACT: Record<string, LucideIcon> = {
  campaign: Sparkles,
  "section-brief": FileText,
  "section-research": TrendingUp,
  "section-strategy": Target,
  creative: Palette,
  tasks: CheckSquare,
  search: Search,
  fetch: Search,
  references: Link2,
  image: Image,
};

/** Ids the tools build with a suffix, so only the prefix is stable. */
const PREFIXES: [string, LucideIcon][] = [
  ["section-", FileText],
  ["build:", Save],
  ["publish:", Save],
  ["retry:", Sparkles],
];

export function stepIcon(stepId: string): LucideIcon {
  const id = stepId.trim();
  const exact = EXACT[id];
  if (exact) return exact;
  for (const [prefix, icon] of PREFIXES) {
    if (id.startsWith(prefix)) return icon;
  }
  return Sparkles;
}
