import { createInstance } from "i18next";
import { describe, expect, it } from "vitest";

import SkillNodes, { RETIRED_NODES } from "../constants/Nodes";
import { TREE_LABELS } from "../constants/TreeLabels";
import {
  SKILL_TEXT_LOCALES,
  getNodeName,
  getSkillDescription,
  getSkillName,
  getSkillPerLevelLabel,
  getSkillText,
  getTreeLabelName,
  skillTextResources,
} from "../text";
import { buildSearchCorpus } from "../utils/searchCorpus";
import { humanizeKey } from "../utils/humanizeKey";
import {
  getGameInterpolationValues,
  getGamePerLevelValues,
  getSkillInterpolationValues,
} from "../utils/skillInterpolation";
import { skillTextPrefix, usesGameText } from "../utils/skillText";

// The text pipeline as the site ran it on its own i18n instance (fallback to
// the default locale, unescaped interpolation), before skill text moved here.
const reference = () => {
  const i18n = createInstance();
  i18n.init({
    resources: skillTextResources,
    lng: "en",
    fallbackLng: "en",
    ns: ["nodes", "tree"],
    defaultNS: "nodes",
    interpolation: { escapeValue: false },
    initAsync: false,
  });
  return (locale: string) => i18n.getFixedT(locale, "nodes") as unknown as (key: string, options?: object) => unknown;
};

describe("skill text", () => {
  const translate = reference();

  it.each(SKILL_TEXT_LOCALES)("matches the tooltip's former output for every type and level (%s)", (locale) => {
    const t = translate(locale);
    for (const [type, metadata] of Object.entries(SkillNodes.types)) {
      const gameText = usesGameText(metadata, locale);
      const prefix = skillTextPrefix(type, metadata, locale);
      expect(getSkillName(type, locale)).toBe(t(`${prefix}.name`, { defaultValue: humanizeKey(type) }));

      for (let level = 1; level <= (metadata.maxLevel ?? 1); level++) {
        const interpolation = gameText
          ? getGameInterpolationValues(metadata, level, locale)
          : getSkillInterpolationValues(metadata, level);
        const raw = t(`${prefix}.description`, { returnObjects: true, ...interpolation });
        expect(getSkillDescription(type, locale, level)).toEqual(Array.isArray(raw) ? raw : [raw]);
      }

      const perLevel = gameText
        ? t(`${prefix}.perLevelLabel`, { defaultValue: "", ...getGamePerLevelValues(metadata, locale) })
        : metadata.perLevel
        ? t(`${type}.perLevelLabel`, {
            defaultValue: metadata.perLevel.label,
            value: metadata.perLevel.value,
            value2: metadata.perLevel.value2,
          })
        : null;
      expect(getSkillPerLevelLabel(type, locale)).toBe(perLevel || null);
    }
  });

  it("resolves every placeholder", () => {
    for (const locale of SKILL_TEXT_LOCALES) {
      for (const [type, metadata] of Object.entries(SkillNodes.types)) {
        const { description, perLevelLabel } = getSkillText(type, locale, metadata.maxLevel ?? 1);
        expect([...description, perLevelLabel ?? ""].join("\n")).not.toMatch(/{{/);
      }
    }
  });

  it("shows French text in French", () => {
    const type = Object.keys(SkillNodes.types).find((key) => getSkillName(key, "fr") !== getSkillName(key, "en"));
    expect(type).toBeDefined();
  });

  it("falls back to the default locale and to the humanized key", () => {
    const type = Object.keys(SkillNodes.types)[0];
    // A locale without text or game text uses the default locale's own record.
    const english = skillTextResources.en.nodes as Record<string, { name?: string }>;
    expect(getSkillName(type, "de")).toBe(english[type].name);
    expect(getSkillName("NOT_A_SKILL", "en")).toBe("Not A Skill");
  });

  it("names nodes by ID, including retired and unknown ones", () => {
    const [id, node] = Object.entries(SkillNodes.nodes)[0];
    expect(getNodeName(id, "fr")).toBe(getSkillName(node.type, "fr"));
    const retired = Object.entries(RETIRED_NODES).find(([, entry]) => entry.name);
    if (retired) expect(getNodeName(retired[0], "en")).toBe(retired[1].name);
    expect(getNodeName("no-such-node", "en")).toBe("#no-such-node");
  });

  it("names every tree label in every locale", () => {
    for (const locale of SKILL_TEXT_LOCALES) {
      for (const label of TREE_LABELS) {
        const name = getTreeLabelName(label.nameKey, locale);
        expect(name).toBe(skillTextResources[locale].tree.treeLabels[label.nameKey as keyof typeof skillTextResources.en.tree.treeLabels]);
      }
    }
  });
});

describe("buildSearchCorpus", () => {
  it("indexes the tooltip's name and level-1 description", () => {
    const corpus = buildSearchCorpus("fr");
    expect(corpus).toHaveLength(Object.keys(SkillNodes.types).length);
    const entry = corpus[0];
    expect(entry.name).toBe(getSkillName(entry.key, "fr"));
    expect(entry.description).not.toMatch(/<|{{/);
    expect(entry.nameNorm.original).toBe(entry.name);
  });
});
