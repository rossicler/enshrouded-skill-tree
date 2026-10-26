import { describe, expect, it } from "vitest";
import SkillNodes from "../constants/Nodes";
import { MAX_FLAME_LEVEL } from "../constants/Biomes";
import { getStatsFromSkills, getTotalStats } from "../utils/stats";

const nodeOfType = (type: string) =>
  Object.keys(SkillNodes.nodes).find((id) => SkillNodes.nodes[id].type === type)!;

describe("getStatsFromSkills", () => {
  it("adds one point per two Flame levels for flame-scaled skills", () => {
    const thickSkin = nodeOfType("THICK_SKIN");
    expect(getStatsFromSkills({ [thickSkin]: 1 }, 1).CONS ?? 0).toBe(0);
    expect(getStatsFromSkills({ [thickSkin]: 1 }, 2).CONS).toBe(1);
    expect(getStatsFromSkills({ [thickSkin]: 1 }, 7).CONS).toBe(3);
    expect(getStatsFromSkills({ [thickSkin]: 1 }, 10).CONS).toBe(5);
  });

  it("covers all six flame-scaled skills", () => {
    const expected: Record<string, string> = {
      BARBARIAN: "STR",
      ENDURANCE_OF_THE_FLAME: "ENDURANCE",
      GRACEFUL_STRIDE: "DEX",
      ARCANE_CONCENTRATION: "SPIRIT",
      EXALTED: "INT",
      THICK_SKIN: "CONS",
    };
    const selection = Object.fromEntries(Object.keys(expected).map((type) => [nodeOfType(type), 1]));
    const stats = getStatsFromSkills(selection, 6) as Record<string, number>;
    Object.values(expected).forEach((stat) => expect(stats[stat]).toBe(3));
  });

  it("is included in the totals with the clamped flame level", () => {
    const thickSkin = nodeOfType("THICK_SKIN");
    const atMax = getTotalStats({}, MAX_FLAME_LEVEL).CONS;
    expect(getTotalStats({ [thickSkin]: 1 }, 5).CONS).toBe(4 + 2);
    expect(getTotalStats({ [thickSkin]: 1 }, MAX_FLAME_LEVEL + 5).CONS).toBe(
      atMax + Math.floor(MAX_FLAME_LEVEL / 2)
    );
  });

  it("still scales fixed stats by purchased level", () => {
    const cons = nodeOfType("ATTR_CONS");
    expect(getStatsFromSkills({ [cons]: 1 }, 10)).toEqual({ CONS: 1 });
    expect(getStatsFromSkills([cons])).toEqual({ CONS: 1 });
  });
});
