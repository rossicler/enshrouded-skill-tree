import { describe, expect, it } from "vitest";

import { buildSkillTree } from "../constants/Nodes";
import { BIOMES, MAX_FLAME_LEVEL, MAX_PLAYER_LEVEL, MAX_SKILL_POINTS_ABSOLUTE, clampFlameLevel } from "../constants/Biomes";
import progression from "../constants/gameProgression.json";
import { fitsUnderHardCap, getMaxSkillPoints, getPointsSummary, getPointsUsed, getSkillCost } from "../points";

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
    expect(getMaxSkillPoints({ playerLevel: 10, unlockedBiomes: ["springlands"] })).toBe(18 + 17);
    expect(getMaxSkillPoints({ playerLevel: 99, unlockedBiomes: BIOMES.map((b) => b.id) })).toBe(MAX_SKILL_POINTS_ABSOLUTE);
    expect(getMaxSkillPoints()).toBe(98);
  });

  it("takes the level cap and every biome's points from the imported game data", () => {
    // Builds 1267041 and 1269579 (1.0): level cap 50 at 2 points per level, 114 exploration points.
    expect(MAX_PLAYER_LEVEL).toBe(50);
    expect(MAX_SKILL_POINTS_ABSOLUTE).toBe(98 + 114);
    expect(BIOMES.map((b) => b.id).sort()).toEqual(Object.keys(progression.biomes).sort());
    for (const biome of BIOMES) expect(biome.explorationPoints).toBe(progression.biomes[biome.id as keyof typeof progression.biomes].points);
    expect(BIOMES.at(-1)?.maxLevel).toBe(MAX_PLAYER_LEVEL);
  });

  it("takes the flame level cap from the imported game data and clamps to it", () => {
    // Build 1269579 (1.0): 10 flame upgrades, from level 1 to 11.
    expect(MAX_FLAME_LEVEL).toBe(progression.flame.flameLevelCap);
    expect(MAX_FLAME_LEVEL).toBe(11);
    expect(clampFlameLevel(0)).toBe(1);
    expect(clampFlameLevel(-3)).toBe(1);
    expect(clampFlameLevel(Number.NaN)).toBe(1);
    expect(clampFlameLevel(4.7)).toBe(4);
    expect(clampFlameLevel(MAX_FLAME_LEVEL)).toBe(MAX_FLAME_LEVEL);
    expect(clampFlameLevel(MAX_FLAME_LEVEL + 9)).toBe(MAX_FLAME_LEVEL);
  });

  it("allows an unlock that lands exactly on the cap", () => {
    expect(fitsUnderHardCap({ "1": 2 }, "2", 5, tree)).toBe(true);
    expect(fitsUnderHardCap({ "1": 2 }, "2", 4, tree)).toBe(false);
    expect(fitsUnderHardCap({ "1": 1 }, "1", 2, tree)).toBe(true);
  });

  it("sums up used, budget and what's left, defaulting to a max-level player who explored every biome", () => {
    expect(getPointsSummary({}, {}, tree)).toEqual({ used: 0, max: MAX_SKILL_POINTS_ABSOLUTE, left: MAX_SKILL_POINTS_ABSOLUTE, full: false, over: false });
    expect(getPointsSummary({ "1": 3, "2": 1 }, { playerLevel: 4, biomes: [] }, tree)).toEqual({ used: 6, max: 6, left: 0, full: true, over: false });
    expect(getPointsSummary({ "1": 3, "2": 1 }, { playerLevel: 3, biomes: [] }, tree)).toEqual({ used: 6, max: 4, left: -2, full: true, over: true });
    const springlands = BIOMES[0];
    expect(getPointsSummary({}, { playerLevel: 1, biomes: [springlands.id] }, tree).max).toBe(springlands.explorationPoints);
  });
});
