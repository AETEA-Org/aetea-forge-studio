import type { CreativeFoundationModel, StrategyModel } from "@/types/api";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Normalize API `creative_foundation` (legacy foundation/rationale or new shape)
 * to the canonical client model.
 */
export function normalizeCreativeFoundation(
  raw: unknown
): CreativeFoundationModel | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }

  const hasNewShape =
    "big_idea" in raw ||
    "key_message" in raw ||
    "creative_direction" in raw ||
    "tagline_or_campaign_line" in raw;
  const hasLegacyShape = "foundation" in raw || "rationale" in raw;

  if (hasNewShape) {
    return {
      big_idea: typeof raw.big_idea === "string" ? raw.big_idea : "",
      key_message: typeof raw.key_message === "string" ? raw.key_message : "",
      tagline_or_campaign_line:
        raw.tagline_or_campaign_line === null ||
        raw.tagline_or_campaign_line === undefined
          ? null
          : typeof raw.tagline_or_campaign_line === "string"
            ? raw.tagline_or_campaign_line
            : null,
      creative_direction:
        typeof raw.creative_direction === "string" ? raw.creative_direction : "",
    };
  }

  if (hasLegacyShape) {
    return {
      big_idea: typeof raw.foundation === "string" ? raw.foundation : "",
      key_message: typeof raw.rationale === "string" ? raw.rationale : "",
      tagline_or_campaign_line: null,
      creative_direction: "",
    };
  }

  if (Object.keys(raw).length === 0) {
    return {
      big_idea: "",
      key_message: "",
      tagline_or_campaign_line: null,
      creative_direction: "",
    };
  }

  return undefined;
}

/** True if any creative foundation field has non-empty display text. */
export function hasCreativeFoundationContent(
  cf: CreativeFoundationModel
): boolean {
  const tag = cf.tagline_or_campaign_line;
  return (
    cf.big_idea.trim() !== "" ||
    cf.key_message.trim() !== "" ||
    cf.creative_direction.trim() !== "" ||
    (typeof tag === "string" && tag.trim() !== "")
  );
}

/**
 * Apply {@link normalizeCreativeFoundation} to fetched strategy JSON so UI uses one shape.
 */
export function normalizeStrategyFromApi(raw: unknown): StrategyModel {
  if (!isRecord(raw)) {
    return raw as StrategyModel;
  }
  const next: Record<string, unknown> = { ...raw };
  const normalized = normalizeCreativeFoundation(next.creative_foundation);
  if (normalized !== undefined) {
    next.creative_foundation = normalized;
  }
  return next as StrategyModel;
}
