import { describe, expect, it } from "vitest";

import { buildSkillTree } from "../constants/Nodes";
import { BIOMES, MAX_SKILL_POINTS_ABSOLUTE } from "../constants/Biomes";
import { fitsUnderHardCap, getMaxSkillPoints, getPointsUsed, getSkillCost } from "../points";

const tree = buildSkillTree(
  { types: { A: { color: "blue" }, B: { color: "red" } }, nodes: {} },
  {
    nodes: {
      "1": { gameNodeId: "g1", type: "A", base: true, position: { x: 0, y: 200 } },
      "2": { gameNodeId: "g2", type: "B", position: { x: 0, y: 260 } },
    },
    edges: [["1", "2"]],
    types: { A: { cost: 1, maxLevel: 3 }, B: { cost: 3 } },
  }
);

describe("points", () => {
  it("costs cost x level per skill, and nothing for unknown skills", () => {
    expect(getSkillCost("2", tree)).toBe(3);
    expect(getSkillCost("9", tree)).toBe(0);
    expect(getPointsUsed({}, tree)).toBe(0);
    expect(getPointsUsed({ "1": 3, "2": 1, "9": 4 }, tree)).toBe(6);
  });

  it("budgets 2 points per level after the first, plus explored biomes", () => {
    expect(getMaxSkillPoints({ playerLevel: 1, unlockedBiomes: [] })).toBe(0);
    expect(getMaxSkillPoints({ playerLevel: 10, unlockedBiomes: [] })).toBe(18);
    expect(getMaxSkillPoints({ playerLevel: 10, unlockedBiomes: ["springlands"] })).toBe(18 + 15);
    expect(getMaxSkillPoints({ playerLevel: 99, unlockedBiomes: BIOMES.map((b) => b.id) })).toBe(MAX_SKILL_POINTS_ABSOLUTE);
    expect(getMaxSkillPoints()).toBe(88);
  });

  it("allows an unlock that lands exactly on the cap", () => {
    expect(fitsUnderHardCap({ "1": 2 }, "2", 5, tree)).toBe(true);
    expect(fitsUnderHardCap({ "1": 2 }, "2", 4, tree)).toBe(false);
    expect(fitsUnderHardCap({ "1": 1 }, "1", 2, tree)).toBe(true);
  });
});
