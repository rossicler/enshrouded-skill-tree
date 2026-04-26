import SkillNodes from "@/constants/Nodes";
import { BasicStats, NodeStatsType } from "@/constants/Stats";

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
