import SkillNodes, { SkillNodesType } from "./constants/Nodes";
import { MAX_PLAYER_LEVEL, computeMaxSkillPoints } from "./constants/Biomes";
import type { SkillSelection } from "./selection";

// Skill points one level of a skill costs.
export const getSkillCost = (id: string, tree: SkillNodesType = SkillNodes): number =>
  tree.types[tree.nodes[id]?.type]?.cost ?? 0;

// Skill points spent on a selection: cost x level for every selected skill.
export const getPointsUsed = (selection: SkillSelection, tree: SkillNodesType = SkillNodes): number =>
  Object.entries(selection).reduce((acc, [id, level]) => acc + getSkillCost(id, tree) * level, 0);

export type PointsBudget = {
  // Defaults to the max player level.
  playerLevel?: number;
  // Biome IDs whose exploration points are collected (see BIOMES).
  unlockedBiomes?: string[];
};

// Skill points available at a player level with the given biomes explored.
export const getMaxSkillPoints = ({ playerLevel = MAX_PLAYER_LEVEL, unlockedBiomes }: PointsBudget = {}): number =>
  computeMaxSkillPoints(playerLevel, unlockedBiomes);

// Whether one more level of `id` stays within `maxPoints` (the hard cap).
export const fitsUnderHardCap = (
  selection: SkillSelection,
  id: string,
  maxPoints: number,
  tree: SkillNodesType = SkillNodes
): boolean => getPointsUsed(selection, tree) + getSkillCost(id, tree) <= maxPoints;
