// Skill and tree text in every supported locale, without the host's i18n
// setup: a private i18next instance holds this package's own resources, so
// the same text renders on the server, in the browser and in any host.
//
// Descriptions and per-level lines are HTML (<b>, <i>, <br>) with
// interpolation unescaped, as the game writes them. Sanitize before rendering
// them as HTML.
import { createInstance, type i18n, type Resource } from "i18next";

import SkillNodes, { RETIRED_NODES, SkillNodesType } from "./constants/Nodes";
import {
  DEFAULT_SKILL_TEXT_LOCALE,
  resolveSkillTextLocale,
  skillTextLoaders,
  type SkillTextResources,
} from "./locales";
import enNodes from "./locales/en/nodes.json";
import enTree from "./locales/en/tree.json";
import { humanizeKey } from "./utils/humanizeKey";
import {
  getGameInterpolationValues,
  getGamePerLevelValues,
  getSkillInterpolationValues,
} from "./utils/skillInterpolation";
import { skillTextPrefix, usesGameText } from "./utils/skillText";

type Translate = (key: string, options?: Record<string, unknown>) => unknown;

let instance: i18n | undefined;
// Locales whose text is in the instance. English is bundled.
const loaded = new Map<string, SkillTextResources>([
  [DEFAULT_SKILL_TEXT_LOCALE, { locale: DEFAULT_SKILL_TEXT_LOCALE, nodes: enNodes, tree: enTree }],
]);
const pending = new Map<string, Promise<SkillTextResources>>();

// Created on first use, so importing this module has no side effects.
const getInstance = (): i18n => {
  if (!instance) {
    instance = createInstance();
    instance.init({
      resources: Object.fromEntries([...loaded].map(([code, { nodes, tree }]) => [code, tree ? { nodes, tree } : { nodes }])) as Resource,
      lng: DEFAULT_SKILL_TEXT_LOCALE,
      fallbackLng: DEFAULT_SKILL_TEXT_LOCALE,
      ns: ["nodes", "tree"],
      defaultNS: "nodes",
      interpolation: { escapeValue: false },
      initAsync: false,
    });
  }
  return instance;
};

// Whether a locale's skill text is available (always for English and for
// codes that resolve to it).
export const isSkillTextLoaded = (locale: string): boolean => loaded.has(resolveSkillTextLocale(locale));

// Adds a locale's text that the host already has, e.g. from loadSkillText on
// the server passed down as page props. Adding a loaded locale again does nothing.
export const addSkillText = (resources: SkillTextResources): void => {
  const code = resolveSkillTextLocale(resources.locale);
  if (loaded.has(code) || code !== resources.locale) return;
  loaded.set(code, resources);
  if (instance) {
    instance.addResourceBundle(code, "nodes", resources.nodes, true, true);
    if (resources.tree) instance.addResourceBundle(code, "tree", resources.tree, true, true);
  }
};

// Loads a locale's text (once) and returns it. Until it resolves, that
// locale's text is English. Unsupported locales resolve to English.
export const loadSkillText = (locale: string): Promise<SkillTextResources> => {
  const code = resolveSkillTextLocale(locale);
  const ready = loaded.get(code);
  if (ready) return Promise.resolve(ready);
  let promise = pending.get(code);
  if (!promise) {
    const loader = skillTextLoaders[code];
    if (!loader) return Promise.resolve(loaded.get(DEFAULT_SKILL_TEXT_LOCALE)!);
    promise = loader().then((module) => {
      const resources = { locale: code, nodes: module.default as Record<string, unknown> };
      addSkillText(resources);
      return resources;
    });
    promise.catch(() => pending.delete(code));
    pending.set(code, promise);
  }
  return promise;
};

// The locale whose text renders for `locale`: its supported locale once
// loaded, English until then.
export const skillTextLocale = (locale: string): string => {
  const code = resolveSkillTextLocale(locale);
  return loaded.has(code) ? code : DEFAULT_SKILL_TEXT_LOCALE;
};

const translator = (locale: string, ns: "nodes" | "tree"): Translate =>
  getInstance().getFixedT(locale, ns) as unknown as Translate;

// The name a locale shows for a skill type, or the humanized type key.
export const getSkillName = (
  type: string,
  locale: string,
  tree: SkillNodesType = SkillNodes,
): string => {
  locale = skillTextLocale(locale);
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
  locale = skillTextLocale(locale);
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
  locale = skillTextLocale(locale);
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
  String(translator(skillTextLocale(locale), "tree")(`treeLabels.${nameKey}`));
