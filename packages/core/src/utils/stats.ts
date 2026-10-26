import SkillNodes from "../constants/Nodes";
import { BasicStats, NodeStatsType, StatsType } from "../constants/Stats";
import { clampFlameLevel } from "../constants/Biomes";

export const getStatsFromSkills = (
  skills: { [id: string]: number } | string[],
  flameLevel = 1
) => {
  const entries: Array<[string, number]> = Array.isArray(skills)
    ? skills.map((id) => [id, 1])
    : Object.entries(skills);
  const stats: Record<string, number> = {};
  const add = (skillStats: NodeStatsType | undefined, multiplier: number) => {
    Object.entries(skillStats ?? {}).forEach(([stat, value]) => {
      stats[stat] = (stats[stat] ?? 0) + value * multiplier;
    });
  };
  entries.forEach(([id, level]) => {
    const skillType = SkillNodes.nodes[id]?.type;
    const metadata = skillType ? SkillNodes.types[skillType] : undefined;
    add(metadata?.stats, level);
    add(metadata?.flameStats, Math.floor(flameLevel / 2));
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

// Attribute points from the selected skills (per level, plus flame-scaled
// skills) and the flame altar (one per attribute for each flame level after
// the first). The flame level is clamped to the game's range.
export const getTotalStats = (
  selection: { [id: string]: number } | string[],
  flameLevel = 1
): StatTotals => {
  const flame = clampFlameLevel(flameLevel);
  const sum = sumStats([getStatsFromSkills(selection, flame), getStatsFromFlameAltar(flame)]);
  return Object.fromEntries(
    (Object.keys(BasicStats) as StatsType[]).map((stat) => [stat, sum[stat] ?? 0])
  ) as StatTotals;
};
