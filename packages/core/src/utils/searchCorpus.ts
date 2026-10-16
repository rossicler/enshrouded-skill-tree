import SkillNodesDefault, {
  NodeTypeMetadata,
  SkillNodesType,
} from "../constants/Nodes";
import { getSkillDescription, getSkillName } from "../text";
import {
  NormalizedText,
  normalizeForSearch,
  stripHtml,
} from "./searchText";

export type SearchEntry = {
  key: string;
  meta: NodeTypeMetadata;
  tier: "small" | "medium" | "large";
  name: string;
  description: string;
  nameNorm: NormalizedText;
  descNorm: NormalizedText;
};

// One entry per skill type, with the same text the tooltip shows in `locale`.
export const buildSearchCorpus = (
  locale: string,
  skillNodes: SkillNodesType = SkillNodesDefault,
): SearchEntry[] => {
  const tierByType: Record<string, "small" | "medium" | "large"> = {};
  Object.values(skillNodes.nodes).forEach((node) => {
    if (tierByType[node.type] == null) {
      tierByType[node.type] = node.tier ?? "small";
    }
  });

  return Object.entries(skillNodes.types).map(([key, meta]) => {
    const name = getSkillName(key, locale, skillNodes);
    // Level-1 values, matching the tooltip's unselected preview.
    const description = getSkillDescription(key, locale, 1, skillNodes)
      .map((p) => stripHtml(p))
      .filter(Boolean)
      .join(" ");

    return {
      key,
      meta,
      tier: tierByType[key] ?? "small",
      name,
      description,
      nameNorm: normalizeForSearch(name, locale),
      descNorm: normalizeForSearch(description, locale),
    };
  });
};
