import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { formatValue, renderText, resolveArgument, loadAuthoredTree, buildCandidate } from "./skill-data.mjs";
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
  });
});

describe("committed import compatibility", () => {
  const authored = loadAuthoredTree();
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
      expect(locale[type].game.descriptionsByLevel).toHaveLength(metadata.maxLevel);
      expect(locale[type].game.descriptionsByLevel[0]).toEqual(metadata.description);
      expect(JSON.stringify(locale[type].game)).not.toMatch(/%k|\{\{/);
    }
    expect(locale.LIFE_ESSENCES.game.descriptionsByLevel[2][0]).toContain("<b>6</b>");
    expect(locale.MASON.game.descriptionsByLevel[2][0]).toContain("<b>30%</b>");
    expect(runtime.types.FROST.importedEnglish).toBe(false);
    expect(locale.FROST.game).toBeUndefined();
  });
  it.runIf(Boolean(process.env.SKILL_DATA_EXPORT))("reproduces the mapping and rejects graph drift from a local export", () => {
    const source = JSON.parse(fs.readFileSync(process.env.SKILL_DATA_EXPORT, "utf8"));
    const { report } = buildCandidate(source, authored, locale, inputs);
    expect(report.mapping).toEqual(mapping);
    expect(report.unresolvedText).toEqual([]);
    expect(report.retainedText.map((entry) => entry.type)).toEqual(["FROST"]);
    expect(report.retainedStats.map((entry) => entry.type)).toEqual(["RANGER"]);
    source.raw.trees[0].data.links.pop();
    expect(() => buildCandidate(source, authored, locale, inputs)).toThrow();
  });
});
