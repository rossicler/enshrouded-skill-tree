import SkillNodes from "@/constants/Nodes";
import { BasicStats, NodeStatsType } from "@/constants/Stats";

export const getStatsFromSkills = (skills: string[]) => {
  const stats: Record<string, number> = {};
  skills.forEach((id) => {
    const skillType = SkillNodes.nodes[id].type;
    const skillStats = SkillNodes.types[skillType].stats;
    if (skillStats) {
      Object.entries(skillStats).forEach(([stat, value]) => {
        stats[stat] = stats[stat] ? stats[stat] + value : value;
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
