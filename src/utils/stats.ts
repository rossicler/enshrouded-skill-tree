import SkillNodes from "@/constants/Nodes";
import { NodeStatsType } from "@/constants/Stats";

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
