import { describe, expect, it } from "vitest";

import { BIOMES, MAX_SKILL_POINTS_ABSOLUTE, clampBonusPoints, computeMaxSkillPoints, MAX_BONUS_POINTS, MIN_BONUS_POINTS } from "../constants/Biomes";
import SkillNodes from "../constants/Nodes";
import { getMaxSkillPoints, getPointsSummary } from "../points";
import { getStatSkillTypes } from "../utils/stats";

const ALL = BIOMES.map((b) => b.id);

describe("bonus points", () => {
  it("adds to or takes from the budget, never below zero", () => {
    expect(getMaxSkillPoints({ unlockedBiomes: ALL, bonusPoints: 5 })).toBe(MAX_SKILL_POINTS_ABSOLUTE + 5);
    expect(getMaxSkillPoints({ unlockedBiomes: ALL, bonusPoints: -3 })).toBe(MAX_SKILL_POINTS_ABSOLUTE - 3);
    expect(getMaxSkillPoints({ playerLevel: 1, unlockedBiomes: [], bonusPoints: -10 })).toBe(0);
    expect(getMaxSkillPoints({ playerLevel: 1, unlockedBiomes: [], bonusPoints: 7 })).toBe(7);
    expect(getPointsSummary({}, { bonusPoints: 2 }).max).toBe(MAX_SKILL_POINTS_ABSOLUTE + 2);
  });

  it("defaults to no adjustment", () => {
    expect(computeMaxSkillPoints(10, [])).toBe(computeMaxSkillPoints(10, [], 0));
    expect(getPointsSummary({}).max).toBe(MAX_SKILL_POINTS_ABSOLUTE);
  });

  it("clamps to whole numbers in range", () => {
    expect(clampBonusPoints(2.7)).toBe(2);
    expect(clampBonusPoints(-2.7)).toBe(-2);
    expect(clampBonusPoints(Number.NaN)).toBe(0);
    expect(clampBonusPoints(1e9)).toBe(MAX_BONUS_POINTS);
    expect(clampBonusPoints(-1e9)).toBe(MIN_BONUS_POINTS);
  });
});

describe("getStatSkillTypes", () => {
  it("finds the attribute nodes of each stat", () => {
    expect(getStatSkillTypes("INT")).toContain("ATTR_INT");
    expect(getStatSkillTypes("STR")).toContain("ATTR_STR");
    expect(getStatSkillTypes("DEX")).toEqual(expect.arrayContaining(["ATTR_DEX", "RANGER"]));
    expect(getStatSkillTypes("INT")).not.toContain("ATTR_DEX");
  });

  it("returns only types that exist on the tree", () => {
    for (const stat of ["CONS", "STR", "ENDURANCE", "DEX", "SPIRIT", "INT"] as const) {
      const types = getStatSkillTypes(stat);
      expect(types.length).toBeGreaterThan(0);
      for (const type of types) expect(SkillNodes.types[type]).toBeDefined();
    }
  });
});
