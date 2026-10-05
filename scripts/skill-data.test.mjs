import { describe, expect, it } from "vitest";
import fs from "node:fs";
import i18next from "i18next";
import { formatValue, renderText, buildTextTemplate, resolveArgument, loadAuthoredTree, buildCandidate, treeContentHash } from "./skill-data.mjs";
import { getGameInterpolationValues } from "../src/utils/skillInterpolation";
import { isDifferentTreeVersion, SKILL_TREE_CONTENT_HASH, SKILL_TREE_GAME_BUILD, SKILL_TREE_UPDATE } from "../src/constants/skillTreeVersion";
import runtime from "../src/constants/gameSkillData.json";
import locale from "../public/locales/en/nodes.json";
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

describe("game argument formatting", () => {
  it("formats percentage noise, signed values and durations", () => {
    expect(formatValue(0.10000000149, "Percentage")).toBe("10%");
    expect(formatValue(2, "Normal", true)).toBe("+2");
    expect(formatValue(-2, "Normal", true)).toBe("-2");
    expect(formatValue(120, "Duration")).toBe("120 seconds");
    expect(() => formatValue(NaN, "Normal")).toThrow();
    expect(() => formatValue(1, "Numberless")).toThrow();
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
    expect(resolveArgument({ type: "Input", id: 18 }, node, interpreted, data, 1, inputs)).toBe("[Special Ability]");
    expect(() => resolveArgument({ type: "Input", id: 999 }, node, interpreted, data, 1, inputs)).toThrow();
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

describe("committed import compatibility", () => {
  const authored = loadAuthoredTree();
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
  it("preserves all 222 IDs and a one-to-one source mapping", () => {
    expect(Object.keys(runtime.nodes).sort()).toEqual(Object.keys(authored.nodes).sort());
    expect(Object.keys(mapping)).toHaveLength(222);
    expect(new Set(Object.values(mapping).map((entry) => entry.appId)).size).toBe(222);
    for (const [gameId, entry] of Object.entries(mapping)) {
      expect(runtime.nodes[entry.appId].gameNodeId).toBe(gameId);
      expect(authored.nodes[entry.appId].type).toBe(entry.type);
    }
  });
  it("generates finite Cartesian centers and all 21 base anchors", () => {
    expect(Object.values(runtime.nodes).filter((entry) => entry.baseAnchor)).toHaveLength(21);
    for (const [id, entry] of Object.entries(runtime.nodes)) {
      expect(entry.position.kind).toBe("cartesian");
      expect(Number.isFinite(entry.position.x) && Number.isFinite(entry.position.y)).toBe(true);
      expect(Boolean(entry.baseAnchor)).toBe(Boolean(authored.nodes[id].base));
    }
  });
  it("keeps metadata and generated English levels in sync", () => {
    for (const [type, metadata] of Object.entries(runtime.types)) {
      if (!metadata.importedEnglish) continue;
      expect(locale[type].game.description).toEqual(metadata.description);
      expect(JSON.stringify(locale[type].game)).not.toMatch(/%k|descriptionsByLevel/);
      for (const values of Object.values(metadata.gameLevelValues ?? {})) expect(values).toHaveLength(metadata.maxLevel);
    }
    expect(locale.LIFE_ESSENCES.game.description[0]).toContain("<b>{{gameValue1}}</b>");
    expect(runtime.types.LIFE_ESSENCES.gameLevelValues.gameValue1).toEqual(["2", "4", "6"]);
    expect(locale.MASON.game.description[0]).toContain("<b>{{gameValue1}}</b>");
    expect(runtime.types.MASON.gameLevelValues.gameValue1).toEqual(["10%", "20%", "30%"]);
    expect(runtime.types.FROST.importedEnglish).toBe(false);
    expect(locale.FROST.game).toBeUndefined();
  });
  it.runIf(Boolean(process.env.SKILL_DATA_EXPORT))("reproduces all English levels with i18next and rejects graph drift", async () => {
    const source = JSON.parse(fs.readFileSync(process.env.SKILL_DATA_EXPORT, "utf8"));
    const { report, candidate } = buildCandidate(source, authored, locale, inputs);
    expect(candidate.treeVersion).toEqual(runtime.treeVersion);
    expect(report.mapping).toEqual(mapping);
    expect(report.unresolvedText).toEqual([]);
    expect(report.retainedText.map((entry) => entry.type)).toEqual(["FROST"]);
    expect(report.retainedStats.map((entry) => entry.type)).toEqual(["RANGER"]);
    const t = i18next.createInstance();
    await t.init({ lng: "en", ns: ["nodes"], defaultNS: "nodes", resources: { en: { nodes: locale } },
      interpolation: { escapeValue: false }, initImmediate: false });
    const interpreted = new Map(source.interpreted.nodes.map((entry) => [entry.gameNodeId, entry]));
    for (const raw of source.raw.trees[0].data.nodes.filter((entry) => entry.type !== "Root")) {
      const id = String(raw.id.value), type = report.mapping[id].type, metadata = runtime.types[type];
      if (!metadata.importedEnglish) continue;
      for (let level = 1; level <= metadata.maxLevel; level++) {
        expect(t.t(`${type}.game.description`, { returnObjects: true,
          ...getGameInterpolationValues(metadata, level) })).toEqual(
          renderText(interpreted.get(id).texts.description, raw, interpreted.get(id), source, level, inputs));
      }
      const rawLabel = renderText(interpreted.get(id).texts.perLevelEffectDescription,
        raw, interpreted.get(id), source, 1, inputs)?.join("<br/>");
      if (rawLabel) expect(t.t(`${type}.game.perLevelLabel`, { ...metadata.gamePerLevelValues })).toBe(rawLabel);
    }
    source.raw.trees[0].data.links.pop();
    expect(() => buildCandidate(source, authored, locale, inputs)).toThrow();
  });
});
