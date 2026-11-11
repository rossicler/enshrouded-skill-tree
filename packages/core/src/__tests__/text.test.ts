import { createInstance } from "i18next";
import { beforeAll, describe, expect, it } from "vitest";

import SkillNodes, { RETIRED_NODES } from "../constants/Nodes";
import { TREE_LABELS } from "../constants/TreeLabels";
import { SKILL_TEXT_LOCALES, resolveSkillTextLocale, type SkillTextResources } from "../locales";
import enNodes from "../locales/en/nodes.json";
import enTree from "../locales/en/tree.json";
import {
  getNodeName,
  getSkillDescription,
  getSkillName,
  getSkillPerLevelLabel,
  getSkillText,
  getTreeLabelName,
  isSkillTextLoaded,
  loadSkillText,
  skillTextLocale,
} from "../text";
import { buildSearchCorpus } from "../utils/searchCorpus";
import { humanizeKey } from "../utils/humanizeKey";
import {
  getGameInterpolationValues,
  getGamePerLevelValues,
  getSkillInterpolationValues,
} from "../utils/skillInterpolation";
import { skillTextPrefix, usesGameText } from "../utils/skillText";

const CODES = SKILL_TEXT_LOCALES.map((info) => info.code);
const resources: Record<string, SkillTextResources> = {};

beforeAll(async () => {
  for (const code of CODES) resources[code] = await loadSkillText(code);
});

// The text pipeline as the site ran it on its own i18n instance (fallback to
// the default locale, unescaped interpolation), before skill text moved here.
const reference = () => {
  const i18n = createInstance();
  i18n.init({
    resources: Object.fromEntries(CODES.map((code) => [code, { nodes: resources[code].nodes, tree: enTree }])),
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
  let translate: ReturnType<typeof reference>;
  beforeAll(() => {
    translate = reference();
  });

  it.each(CODES)("matches the tooltip's former output for every type and level (%s)", (locale) => {
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
    for (const locale of CODES) {
      for (const [type, metadata] of Object.entries(SkillNodes.types)) {
        const { description, perLevelLabel } = getSkillText(type, locale, metadata.maxLevel ?? 1);
        expect([...description, perLevelLabel ?? ""].join("\n")).not.toMatch(/{{/);
      }
    }
  });

  it.each(CODES.filter((code) => code !== "en"))("shows the game's text in %s", (locale) => {
    // Every type has the locale's game text, so most names differ from English.
    const types = Object.keys(SkillNodes.types);
    for (const type of types) expect(usesGameText(SkillNodes.types[type], locale)).toBe(true);
    const translated = types.filter((type) => getSkillName(type, locale) !== getSkillName(type, "en"));
    expect(translated.length).toBeGreaterThan(types.length / 2);
  });

  it("falls back to the default locale and to the humanized key", () => {
    const type = Object.keys(SkillNodes.types)[0];
    // An unsupported locale shows English.
    expect(getSkillName(type, "xx")).toBe(getSkillName(type, "en"));
    expect(getSkillName("NOT_A_SKILL", "en")).toBe("Not A Skill");
  });

  it("resolves regional and script variants to a supported locale", () => {
    expect(resolveSkillTextLocale("fr-CA")).toBe("fr");
    expect(resolveSkillTextLocale("pt")).toBe("pt-BR");
    expect(resolveSkillTextLocale("pt-PT")).toBe("pt-BR");
    expect(resolveSkillTextLocale("zh")).toBe("zh-CN");
    expect(resolveSkillTextLocale("zh-HK")).toBe("zh-TW");
    expect(resolveSkillTextLocale("zh-Hant-TW")).toBe("zh-TW");
    expect(resolveSkillTextLocale("zh-Hans-CN")).toBe("zh-CN");
    expect(resolveSkillTextLocale("de_DE")).toBe("de");
    expect(resolveSkillTextLocale("xx")).toBe("en");
    expect(resolveSkillTextLocale(undefined)).toBe("en");
    // Regional codes share the base language's text.
    expect(getSkillName(Object.keys(SkillNodes.types)[0], "de-AT")).toBe(getSkillName(Object.keys(SkillNodes.types)[0], "de"));
    expect(skillTextLocale("de-AT")).toBe("de");
  });

  it("formats values the way each game language does", () => {
    // Russian uses a decimal comma, so a fractional value reads "1,5" there.
    const type = Object.entries(SkillNodes.types).find(([, meta]) => meta.gameLocaleValues?.ru)?.[0];
    expect(type).toBeDefined();
    expect(getSkillDescription(type!, "ru").join(" ")).not.toBe(getSkillDescription(type!, "en").join(" "));
  });

  it("names nodes by ID, including retired and unknown ones", () => {
    const [id, node] = Object.entries(SkillNodes.nodes)[0];
    expect(getNodeName(id, "fr")).toBe(getSkillName(node.type, "fr"));
    const retired = Object.entries(RETIRED_NODES).find(([, entry]) => entry.name);
    if (retired) expect(getNodeName(retired[0], "en")).toBe(retired[1].name);
    expect(getNodeName("no-such-node", "en")).toBe("#no-such-node");
  });

  it("names every tree label in every locale (the English labels drawn on the tree)", () => {
    for (const locale of CODES) {
      for (const label of TREE_LABELS) {
        expect(getTreeLabelName(label.nameKey, locale)).toBe(enTree.treeLabels[label.nameKey as keyof typeof enTree.treeLabels]);
      }
    }
  });
});

describe("loading", () => {
  it("has every language's text loaded after loadSkillText", () => {
    for (const code of CODES) expect(isSkillTextLoaded(code)).toBe(true);
    expect((resources.en.nodes as typeof enNodes)).toBe(enNodes);
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
