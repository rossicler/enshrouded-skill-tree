import SkillNodesDefault, {
  NodeTypeMetadata,
  SkillNodesType,
} from "@/constants/Nodes";
import { humanizeKey } from "@/utils/utils";
import { getSkillInterpolationValues } from "@/utils/skillInterpolation";
import {
  NormalizedText,
  normalizeForSearch,
  stripHtml,
} from "@/utils/searchText";

export type SearchEntry = {
  key: string;
  meta: NodeTypeMetadata;
  tier: "small" | "medium" | "large";
  name: string;
  description: string;
  nameNorm: NormalizedText;
  descNorm: NormalizedText;
};

type Translator = (key: string, options?: Record<string, unknown>) => unknown;

export const buildSearchCorpus = (
  t: Translator,
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
    const name = String(
      t(`${key}.name`, { ns: "nodes", defaultValue: humanizeKey(key) }),
    );
    // Interpolate with level-1 values, matching the tooltip's unselected preview.
    const rawDescription = t(`${key}.description`, {
      ns: "nodes",
      returnObjects: true,
      ...getSkillInterpolationValues(meta, 1),
    });
    const paragraphs = Array.isArray(rawDescription)
      ? rawDescription
      : [rawDescription];
    const description = paragraphs
      .map((p) => stripHtml(String(p)))
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
