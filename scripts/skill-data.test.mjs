import { describe, expect, it } from "vitest";
import fs from "node:fs";
import i18next from "i18next";
import { formatValue, renderText, buildTextTemplate, resolveArgument, loadAuthoredPresentation, runImport, treeContentHash, candidateContentHash,
  alignText, localeFormat, GAME_LOCALES } from "./skill-data.mjs";
import { getGameInterpolationValues, getGamePerLevelValues } from "../src/utils/skillInterpolation";
import { isDifferentTreeVersion, SKILL_TREE_CONTENT_HASH, SKILL_TREE_GAME_BUILD, SKILL_TREE_UPDATE } from "../src/constants/skillTreeVersion";
import runtime from "../src/constants/gameSkillData.json";
import locale from "../public/locales/en/nodes.json";
import frLocale from "../public/locales/fr/nodes.json";
import mapping from "./skill-data-mapping.json";
import inputs from "./skill-data-inputs.json";

const config = {
  variantType: "keen::impact::ScaledFloatImpactConfig",
  value: { configId: { value: 1 }, value: 0, scaleFactor: 0.1, valueFormat: "Percentage", isSigned: false,
    function: "Linear", source: { sourceEntity: "Self" } },
};
const node = { configValues: { simple: [], scaled: [config] } };
const interpreted = { effects: [{ sourcePath: "configValues.scaled[1]", sourceAttribute: { name: "Level" } }] };
const data = { raw: { balancing: [{ data: { playerHealthPerAP: 50, playerManaPerAP: 20, playerStaminaPerAP: 10 } }] } };

const uiText = {
  gameplayActionLabels: { weaponSkill: { status: "resolved", texts: { En_Us: "Special Ability", Fr_Fr: "Capacité spéciale" } },
    guard: { status: "unresolved", texts: {} } },
  punctuation: { decimalSeparator: { status: "resolved", texts: { En_Us: ".", Fr_Fr: "," } } },
  timeUnitsAbbreviations: { status: "resolved", texts: { En_Us: "d,h,min,s", Fr_Fr: "j,h,m,sec" } },
};

describe("game argument formatting", () => {
  it("formats percentage noise, signed values and durations", () => {
    expect(formatValue(0.10000000149, "Percentage")).toBe("10%");
    expect(formatValue(2, "Normal", true)).toBe("+2");
    expect(formatValue(-2, "Normal", true)).toBe("-2");
    expect(formatValue(120, "Duration", false, { seconds: "s" })).toBe("120 s");
    expect(formatValue(2.1, "Normal", false, { decimalSeparator: "," })).toBe("2,1");
    expect(() => formatValue(120, "Duration")).toThrow();
    expect(() => formatValue(NaN, "Normal")).toThrow();
    expect(() => formatValue(1, "Numberless")).toThrow();
  });
  it("takes separators, time units and action labels from the game per locale", () => {
    const inputs = { 18: "weaponSkill", 72: "guard" };
    expect(localeFormat({ raw: { uiText } }, "En_Us", inputs)).toEqual({ decimalSeparator: ".", seconds: "s", inputLabels: { 18: "[Special Ability]" } });
    expect(localeFormat({ raw: { uiText } }, "Fr_Fr", inputs)).toEqual({ decimalSeparator: ",", seconds: "sec", inputLabels: { 18: "[Capacité spéciale]" } });
    expect(() => localeFormat({ raw: { uiText } }, "De_De", inputs)).toThrow();
  });
  it("evaluates level scaling without treating character stats as levels", () => {
    expect(resolveArgument({ type: "Config", id: 1 }, node, interpreted, data, 3)).toBe("30%");
    const changed = structuredClone(interpreted);
    changed.effects[0].sourceAttribute.name = "Intelligence";
    expect(() => resolveArgument({ type: "Config", id: 1 }, node, changed, data, 3)).toThrow();
    const unsupported = structuredClone(node);
    unsupported.configValues.scaled[0].variantType = "keen::impact::ScaledTimeImpactConfig";
    expect(() => resolveArgument({ type: "Config", id: 1 }, unsupported, interpreted, data, 3)).toThrow();
  });
  it("uses checked balancing values and action labels", () => {
    expect(resolveArgument({ type: "Balancing", id: 0 }, node, interpreted, data, 1)).toBe("50");
    expect(resolveArgument({ type: "Balancing", id: 1 }, node, interpreted, data, 1)).toBe("20");
    expect(resolveArgument({ type: "Balancing", id: 2 }, node, interpreted, data, 1)).toBe("10");
    const format = localeFormat({ raw: { uiText } }, "Fr_Fr", inputs);
    expect(inputs[18]).toBe("weaponSkill");
    expect(resolveArgument({ type: "Input", id: 18 }, node, interpreted, data, 1, format)).toBe("[Capacité spéciale]");
    expect(() => resolveArgument({ type: "Input", id: 999 }, node, interpreted, data, 1, format)).toThrow();
  });
  it("preserves paragraphs, handles escaped percents, and rejects argument drift", () => {
    const text = { status: "resolved-template", template: "Gain %k.\nNext line.\n\n100%%", arguments: [{ type: "Config", id: 1 }] };
    expect(renderText(text, node, interpreted, data, 2)).toEqual(["Gain 20%.<br/>Next line.", "100%"]);
    expect(() => renderText({ ...text, arguments: [] }, node, interpreted, data, 1)).toThrow();
    expect(() => renderText({ ...text, template: "No placeholder" }, node, interpreted, data, 1)).toThrow();
    expect(buildTextTemplate(text, node, interpreted, data, 3)).toEqual({
      template: ["Gain {{gameValue1}}.<br/>Next line.", "100%"],
      values: { gameValue1: ["10%", "20%", "30%"] },
    });
  });
});

describe("translated templates", () => {
  const a = { type: "Config", id: 1 }, b = { type: "Config", id: 2 };
  const primary = { status: "resolved-template", tagId: 7, template: "%k then %k", arguments: [a, b] };
  const french = (template, args) => ({ status: "resolved-template", tagId: 7, template, arguments: args });
  const twoConfigs = { configValues: { simple: [], scaled: [config, { ...config, value: { ...config.value, configId: { value: 2 }, scaleFactor: 0.5 } }] } };
  const twoEffects = { effects: [...interpreted.effects, { sourcePath: "configValues.scaled[2]", sourceAttribute: { name: "Level" } }] };

  it("keeps the default locale's placeholder numbers for same-order and reordered arguments", () => {
    expect(alignText(primary, french("%k puis %k", [a, b]), "Fr_Fr").placeholders).toBeUndefined();
    const reordered = alignText(primary, french("%k avant %k", [b, a]), "Fr_Fr");
    expect(buildTextTemplate(reordered, twoConfigs, twoEffects, data, 1)).toEqual({
      template: ["{{gameValue2}} avant {{gameValue1}}"], values: { gameValue1: ["10%"], gameValue2: ["50%"] },
    });
  });

  it("rejects other argument differences unless they are a checked exception", () => {
    expect(() => alignText(primary, french("%k et %k", [b, b]), "Fr_Fr")).toThrow(/arguments differ/);
    expect(() => alignText(primary, { ...french("%k", [a]), tagId: 8 }, "Fr_Fr")).toThrow(/reference differs/);
    expect(() => alignText(primary, undefined, "Fr_Fr")).toThrow(/No Fr_Fr text/);
    const fatal = { status: "resolved-template", tagId: 302340431, template: "%k / %k",
      arguments: [{ type: "Config", id: 2678326661 }, { type: "Config", id: 3431225444 }] };
    const exceptions = [];
    const used = alignText(fatal, { ...fatal, arguments: [fatal.arguments[1], fatal.arguments[1]] }, "Fr_Fr", exceptions);
    expect(used.arguments).toEqual(fatal.arguments);
    expect(exceptions).toHaveLength(1);
    expect(() => alignText(fatal, { ...fatal, arguments: [fatal.arguments[0], fatal.arguments[0]] }, "Fr_Fr")).toThrow();
  });
});

describe("committed import compatibility", () => {
  const presentation = loadAuthoredPresentation();
  it("uses a stable content revision independent of object key order", () => {
    expect(treeContentHash({ nodes: { b: 2, a: 1 }, types: [] })).toBe(
      treeContentHash({ types: [], nodes: { a: 1, b: 2 } }));
    expect(treeContentHash({ nodes: { a: 1 } })).not.toBe(treeContentHash({ nodes: { a: 2 } }));
    expect(runtime.treeVersion.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(SKILL_TREE_CONTENT_HASH).toBe(runtime.treeVersion.contentHash);
    expect(SKILL_TREE_GAME_BUILD).toBe("1076226");
    expect(SKILL_TREE_UPDATE).toBe("8");
    expect(isDifferentTreeVersion({})).toBe(false); // pre-versioned builds remain supported
    expect(isDifferentTreeVersion({ treeContentHash: SKILL_TREE_CONTENT_HASH })).toBe(false);
    expect(isDifferentTreeVersion({ treeContentHash: "older-tree" })).toBe(true);
  });
  it("keeps a one-to-one checked mapping that never reuses retired IDs", () => {
    const active = Object.entries(mapping.nodes);
    expect(active).toHaveLength(Object.keys(runtime.nodes).length);
    expect(new Set(active.map(([, entry]) => entry.appId)).size).toBe(active.length);
    for (const [gameId, entry] of active) {
      expect(runtime.nodes[entry.appId].gameNodeId).toBe(gameId);
      expect(runtime.nodes[entry.appId].type).toBe(entry.type);
      expect(presentation.types[entry.type]).toBeDefined();
      expect(presentation.nodes[entry.appId]?.tier).toBeDefined();
    }
    for (const [appId, entry] of Object.entries(mapping.retired)) {
      expect(runtime.nodes[appId]).toBeUndefined();
      expect(runtime.retired[appId]).toEqual({ type: entry.type, name: entry.name });
    }
    expect(Object.keys(runtime.retired)).toEqual(Object.keys(mapping.retired));
  });
  it("hashes the committed nodes, edges, types and every locale's game text", () => {
    const types = Object.fromEntries(Object.entries(runtime.types).map(([type, metadata]) => {
      const { name, description, ...rest } = metadata;
      return [type, rest];
    }));
    const locales = { en: locale, fr: frLocale };
    const text = Object.fromEntries(Object.entries(locales).map(([lang, nodes]) => [lang, Object.fromEntries(Object.keys(runtime.types)
      .filter((type) => runtime.types[type].gameTextLocales?.includes(lang)).map((type) => [type, nodes[type].game]))]));
    expect(candidateContentHash({ nodes: runtime.nodes, edges: runtime.edges, types, text }))
      .toBe(runtime.treeVersion.contentHash);
  });
  it("generates finite Cartesian centers and an anchor for every base node", () => {
    expect(Object.values(runtime.nodes).some((entry) => entry.base)).toBe(true);
    for (const entry of Object.values(runtime.nodes)) {
      expect(entry.position.kind).toBe("cartesian");
      expect(Number.isFinite(entry.position.x) && Number.isFinite(entry.position.y)).toBe(true);
      expect(Boolean(entry.baseAnchor)).toBe(Boolean(entry.base));
    }
  });
  it("keeps metadata and generated game text levels in sync", () => {
    for (const [type, metadata] of Object.entries(runtime.types)) {
      if (!metadata.gameTextLocales) continue;
      expect(metadata.gameTextLocales).toEqual(Object.keys(GAME_LOCALES));
      expect(locale[type].game.description).toEqual(metadata.description);
      for (const nodes of [locale, frLocale]) expect(JSON.stringify(nodes[type].game)).not.toMatch(/%k|descriptionsByLevel/);
      for (const values of Object.values(metadata.gameLevelValues ?? {})) expect(values).toHaveLength(metadata.maxLevel);
    }
    expect(locale.LIFE_ESSENCES.game.description[0]).toContain("<b>{{gameValue1}}</b>");
    expect(runtime.types.LIFE_ESSENCES.gameLevelValues.gameValue1).toEqual(["2", "4", "6"]);
    expect(locale.MASON.game.description[0]).toContain("<b>{{gameValue1}}</b>");
    expect(runtime.types.MASON.gameLevelValues.gameValue1).toEqual(["10%", "20%", "30%"]);
    expect(runtime.types.FROST.gameTextLocales).toBeUndefined();
    expect(locale.FROST.game).toBeUndefined();
    expect(frLocale.FROST.game).toBeUndefined();
  });
  it.runIf(Boolean(process.env.SKILL_DATA_EXPORT))("reproduces all English and French levels with i18next and rejects graph drift", async () => {
    const source = JSON.parse(fs.readFileSync(process.env.SKILL_DATA_EXPORT, "utf8"));
    const run = (data) => runImport({ data, mapping, previous: runtime, presentation, locales: { en: locale, fr: frLocale }, inputs });
    const { report, candidate, nextMapping, blockers } = run(source);
    expect(blockers).toEqual([]);
    expect(candidate.treeVersion).toEqual(runtime.treeVersion);
    expect(nextMapping).toEqual(mapping);
    expect(report.unresolvedText).toEqual([]);
    expect(report.retainedText.map((entry) => entry.type)).toEqual(["FROST"]);
    expect(report.retainedStats.map((entry) => entry.type)).toEqual(["RANGER"]);
    expect(report.argumentExceptions.map((entry) => `${entry.type} ${entry.locale}`).sort()).toEqual(["FATAL_PRECISION Fr_Fr", "SHROUD_FILTER Fr_Fr"]);
    const t = i18next.createInstance();
    await t.init({ lng: "en", ns: ["nodes"], defaultNS: "nodes", resources: { en: { nodes: locale }, fr: { nodes: frLocale } },
      interpolation: { escapeValue: false }, initImmediate: false });
    const interpreted = new Map(source.interpreted.nodes.map((entry) => [entry.gameNodeId, entry]));
    for (const [lang, gameLocale] of Object.entries(GAME_LOCALES)) {
      const tl = t.getFixedT(lang);
      const format = localeFormat(source, gameLocale, inputs);
      const textOf = (entry, field) => gameLocale === source.locale ? entry.texts[field]
        : alignText(entry.texts[field], entry.translations[gameLocale][field], gameLocale);
      for (const raw of source.raw.trees[0].data.nodes.filter((entry) => entry.type !== "Root")) {
        const id = String(raw.id.value), type = mapping.nodes[id].type, metadata = runtime.types[type];
        if (!metadata.gameTextLocales) continue;
        const entry = interpreted.get(id);
        expect(tl(`${type}.game.name`)).toBe(textOf(entry, "name").template);
        for (let level = 1; level <= metadata.maxLevel; level++) {
          expect(tl(`${type}.game.description`, { returnObjects: true,
            ...getGameInterpolationValues(metadata, level, lang) })).toEqual(
            renderText(textOf(entry, "description"), raw, entry, source, level, format));
        }
        const rawLabel = renderText(textOf(entry, "perLevelEffectDescription"), raw, entry, source, 1, format)?.join("<br/>");
        if (rawLabel) expect(tl(`${type}.game.perLevelLabel`, { ...getGamePerLevelValues(metadata, lang) })).toBe(rawLabel);
      }
    }
    source.raw.trees[0].data.links.pop();
    const drifted = run(source);
    expect(Object.values(drifted.report.graph).flat().length).toBeGreaterThan(0);
    expect(drifted.blockers.length).toBeGreaterThan(0);
  });
});
