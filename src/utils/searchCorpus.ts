import SkillNodesDefault, {
  NodeTypeMetadata,
  SkillNodesType,
} from "@/constants/Nodes";
import { humanizeKey } from "@/utils/utils";
import {
  getGameInterpolationValues,
  getSkillInterpolationValues,
} from "@/utils/skillInterpolation";
import { skillTextPrefix, usesGameText } from "@/utils/skillText";
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
    // Index the same text the tooltip shows.
    const gameText = usesGameText(meta, locale);
    const prefix = skillTextPrefix(key, meta, locale);
    const name = String(
      t(`${prefix}.name`, { ns: "nodes", defaultValue: humanizeKey(key) }),
    );
    // Interpolate with level-1 values, matching the tooltip's unselected preview.
    const rawDescription = t(`${prefix}.description`, {
      ns: "nodes",
      returnObjects: true,
      ...(gameText
        ? getGameInterpolationValues(meta, 1)
        : getSkillInterpolationValues(meta, 1)),
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
