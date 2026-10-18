import SkillNodes from "../constants/Nodes";
import { BasicStats, NodeStatsType, StatsType } from "../constants/Stats";
import { clampFlameLevel } from "../constants/Biomes";

export const getStatsFromSkills = (
  skills: { [id: string]: number } | string[]
) => {
  const entries: Array<[string, number]> = Array.isArray(skills)
    ? skills.map((id) => [id, 1])
    : Object.entries(skills);
  const stats: Record<string, number> = {};
  entries.forEach(([id, level]) => {
    const skillType = SkillNodes.nodes[id]?.type;
    const skillStats = skillType ? SkillNodes.types[skillType]?.stats : undefined;
    if (skillStats) {
      Object.entries(skillStats).forEach(([stat, value]) => {
        stats[stat] = (stats[stat] ?? 0) + value * level;
      });
    }
  });

  return stats as NodeStatsType;
};

export const getStatsFromFlameAltar = (flameLevel: number) => {
  const stats: Record<string, number> = {};
  Object.keys(BasicStats).forEach((stat) => {
    stats[stat] = flameLevel - 1;
  });

  return stats as NodeStatsType;
};

export const sumStats = (stats: NodeStatsType[]) => {
  const sum: Record<string, number> = {};
  stats.forEach((stat) => {
    Object.entries(stat).forEach(([key, value]) => {
      sum[key] = sum[key] ? sum[key] + value : value;
    });
  });

  return sum as NodeStatsType;
};

// Every basic stat, at 0 when nothing adds to it.
export type StatTotals = Record<StatsType, number>;

// Attribute points from the selected skills (per level) plus the flame altar
// (one per attribute for each flame level after the first). The flame level
// is clamped to the game's range.
export const getTotalStats = (
  selection: { [id: string]: number } | string[],
  flameLevel = 1
): StatTotals => {
  const sum = sumStats([getStatsFromSkills(selection), getStatsFromFlameAltar(clampFlameLevel(flameLevel))]);
  return Object.fromEntries(
    (Object.keys(BasicStats) as StatsType[]).map((stat) => [stat, sum[stat] ?? 0])
  ) as StatTotals;
};
