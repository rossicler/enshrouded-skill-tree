// Skill and tree text in every supported locale, without the host's i18n
// setup: a private i18next instance holds this package's own resources, so
// the same text renders on the server, in the browser and in any host.
//
// Descriptions and per-level lines are HTML (<b>, <i>, <br>) with
// interpolation unescaped, as the game writes them. Sanitize before rendering
// them as HTML.
import { createInstance, type i18n } from "i18next";

import SkillNodes, { RETIRED_NODES, SkillNodesType } from "./constants/Nodes";
import enNodes from "./locales/en/nodes.json";
import enTree from "./locales/en/tree.json";
import frNodes from "./locales/fr/nodes.json";
import frTree from "./locales/fr/tree.json";
import { humanizeKey } from "./utils/humanizeKey";
import {
  getGameInterpolationValues,
  getGamePerLevelValues,
  getSkillInterpolationValues,
} from "./utils/skillInterpolation";
import { skillTextPrefix, usesGameText } from "./utils/skillText";

export const SKILL_TEXT_LOCALES = ["en", "fr"] as const;
export type SkillTextLocale = (typeof SKILL_TEXT_LOCALES)[number];
export const DEFAULT_SKILL_TEXT_LOCALE: SkillTextLocale = "en";

// nodes: per-type skill text (see skillTextPrefix). tree: tree labels.
export const skillTextResources = {
  en: { nodes: enNodes, tree: enTree },
  fr: { nodes: frNodes, tree: frTree },
};

type Translate = (key: string, options?: Record<string, unknown>) => unknown;

let instance: i18n | undefined;

// Created on first use, so importing this module has no side effects.
const translator = (locale: string, ns: "nodes" | "tree"): Translate => {
  if (!instance) {
    instance = createInstance();
    instance.init({
      resources: skillTextResources,
      lng: DEFAULT_SKILL_TEXT_LOCALE,
      fallbackLng: DEFAULT_SKILL_TEXT_LOCALE,
      ns: ["nodes", "tree"],
      defaultNS: "nodes",
      interpolation: { escapeValue: false },
      initAsync: false,
    });
  }
  return instance.getFixedT(locale, ns) as unknown as Translate;
};

// The name a locale shows for a skill type, or the humanized type key.
export const getSkillName = (
  type: string,
  locale: string,
  tree: SkillNodesType = SkillNodes,
): string => {
  const prefix = skillTextPrefix(type, tree.types[type], locale);
  return String(translator(locale, "nodes")(`${prefix}.name`, { defaultValue: humanizeKey(type) }));
};

// Description paragraphs (HTML) with the values of a purchased level. Level 1
// is also the preview for a skill that is not selected yet.
export const getSkillDescription = (
  type: string,
  locale: string,
  level = 1,
  tree: SkillNodesType = SkillNodes,
): string[] => {
  const metadata = tree.types[type];
  const interpolation = usesGameText(metadata, locale)
    ? getGameInterpolationValues(metadata, level, locale)
    : getSkillInterpolationValues(metadata, level);
  const raw = translator(locale, "nodes")(`${skillTextPrefix(type, metadata, locale)}.description`, {
    returnObjects: true,
    ...interpolation,
  });
  return (Array.isArray(raw) ? raw : [raw]).map(String);
};

// The per-level line (HTML) shown under the description, or null for a type
// without one.
export const getSkillPerLevelLabel = (
  type: string,
  locale: string,
  tree: SkillNodesType = SkillNodes,
): string | null => {
  const metadata = tree.types[type];
  const t = translator(locale, "nodes");
  if (usesGameText(metadata, locale)) {
    const label = t(`${skillTextPrefix(type, metadata, locale)}.perLevelLabel`, {
      defaultValue: "",
      ...getGamePerLevelValues(metadata, locale),
    });
    return label ? String(label) : null;
  }
  if (!metadata?.perLevel) return null;
  return String(
    t(`${type}.perLevelLabel`, {
      defaultValue: metadata.perLevel.label,
      value: metadata.perLevel.value,
      value2: metadata.perLevel.value2,
    }),
  );
};

export type SkillText = {
  name: string;
  description: string[];
  perLevelLabel: string | null;
};

export const getSkillText = (
  type: string,
  locale: string,
  level = 1,
  tree: SkillNodesType = SkillNodes,
): SkillText => ({
  name: getSkillName(type, locale, tree),
  description: getSkillDescription(type, locale, level, tree),
  perLevelLabel: getSkillPerLevelLabel(type, locale, tree),
});

// The name of a node by app ID, including nodes retired by a game update
// (old builds may still list them). Unknown IDs show as "#<id>".
export const getNodeName = (
  id: string,
  locale: string,
  tree: SkillNodesType = SkillNodes,
  retired: { [id: string]: { name?: string } } = RETIRED_NODES,
): string => {
  const node = tree.nodes[id];
  if (!node) return retired[id]?.name ?? `#${id}`;
  return getSkillName(node.type, locale, tree);
};

// The text of a tree label (TREE_LABELS[].nameKey).
export const getTreeLabelName = (nameKey: string, locale: string): string =>
  String(translator(locale, "tree")(`treeLabels.${nameKey}`));
