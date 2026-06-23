import type {
  CreativeDirectionModel,
  CreativeFoundationModel,
  CreativeTerritoryModel,
  KeyVisualRouteModel,
  StrategyModel,
} from "@/types/api";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

const emptyDirection: CreativeDirectionModel = {
  visual_direction: [],
  photography: [],
  motion_style: [],
  color_system: [],
  typography: [],
};

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeDirection(raw: unknown): CreativeDirectionModel {
  if (!isRecord(raw)) return emptyDirection;
  return {
    visual_direction: stringArray(raw.visual_direction),
    photography: stringArray(raw.photography),
    motion_style: stringArray(raw.motion_style),
    color_system: stringArray(raw.color_system),
    typography: stringArray(raw.typography),
  };
}

function normalizeKvRoute(raw: unknown, index: number): KeyVisualRouteModel {
  if (!isRecord(raw)) {
    return { label: `KV Route ${String.fromCharCode(65 + index)}`, description: "", headline: "" };
  }
  return {
    label:
      typeof raw.label === "string"
        ? raw.label
        : `KV Route ${String.fromCharCode(65 + index)}`,
    description: typeof raw.description === "string" ? raw.description : "",
    headline: typeof raw.headline === "string" ? raw.headline : "",
  };
}

function normalizeTerritory(raw: unknown, index: number): CreativeTerritoryModel {
  const fallbackId = `territory_${index + 1}`;
  if (!isRecord(raw)) {
    return {
      id: fallbackId,
      title: "",
      concept: "",
      rationale: "",
      sample_executions: [],
      emotional_territory: "",
      selected: index === 0,
      creative_direction: emptyDirection,
      kv_routes: [],
    };
  }
  return {
    id: typeof raw.id === "string" ? raw.id : fallbackId,
    title: typeof raw.title === "string" ? raw.title : "",
    concept: typeof raw.concept === "string" ? raw.concept : "",
    rationale: typeof raw.rationale === "string" ? raw.rationale : "",
    sample_executions: stringArray(raw.sample_executions),
    emotional_territory:
      typeof raw.emotional_territory === "string" ? raw.emotional_territory : "",
    selected: raw.selected === true,
    creative_direction: normalizeDirection(raw.creative_direction),
    kv_routes: Array.isArray(raw.kv_routes)
      ? raw.kv_routes.map((route, routeIndex) => normalizeKvRoute(route, routeIndex))
      : [],
  };
}

/**
 * Normalize API `creative_foundation` to the canonical client model.
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
    "creative_territories" in raw ||
    "tagline_or_campaign_line" in raw;
  const hasLegacyShape = "foundation" in raw || "rationale" in raw;

  if (hasNewShape) {
    const territories = Array.isArray(raw.creative_territories)
      ? raw.creative_territories.map((territory, index) =>
          normalizeTerritory(territory, index)
        )
      : [];
    const selectedCount = territories.filter((territory) => territory.selected).length;
    const normalizedTerritories =
      selectedCount === 1
        ? territories
        : territories.map((territory, index) => ({
            ...territory,
            selected: index === 0,
          }));
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
      creative_territories: normalizedTerritories,
    };
  }

  if (hasLegacyShape) {
    return {
      big_idea: typeof raw.foundation === "string" ? raw.foundation : "",
      key_message: typeof raw.rationale === "string" ? raw.rationale : "",
      tagline_or_campaign_line: null,
      creative_territories: [],
    };
  }

  if (Object.keys(raw).length === 0) {
    return {
      big_idea: "",
      key_message: "",
      tagline_or_campaign_line: null,
      creative_territories: [],
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
    cf.creative_territories.length > 0 ||
    (typeof tag === "string" && tag.trim() !== "")
  );
}

export function getSelectedCreativeTerritory(
  cf: CreativeFoundationModel | undefined
): CreativeTerritoryModel | undefined {
  if (!cf?.creative_territories.length) return undefined;
  return (
    cf.creative_territories.find((territory) => territory.selected) ||
    cf.creative_territories[0]
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
