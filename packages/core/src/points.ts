import SkillNodes, { SkillNodesType } from "./constants/Nodes";
import { BIOMES, MAX_PLAYER_LEVEL, computeMaxSkillPoints } from "./constants/Biomes";
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
  // Manual adjustment added to the budget (negative to remove points).
  bonusPoints?: number;
};

// Skill points available at a player level with the given biomes explored.
export const getMaxSkillPoints = ({ playerLevel = MAX_PLAYER_LEVEL, unlockedBiomes, bonusPoints = 0 }: PointsBudget = {}): number =>
  computeMaxSkillPoints(playerLevel, unlockedBiomes, bonusPoints);

// Whether one more level of `id` stays within `maxPoints` (the hard cap).
export const fitsUnderHardCap = (
  selection: SkillSelection,
  id: string,
  maxPoints: number,
  tree: SkillNodesType = SkillNodes
): boolean => getPointsUsed(selection, tree) + getSkillCost(id, tree) <= maxPoints;

export type PointsSummary = {
  // Skill points the selection spends.
  used: number;
  // The budget: leveling points plus the explored biomes' points.
  max: number;
  // max - used; negative when the build is over budget.
  left: number;
  // Every point is spent (used >= max).
  full: boolean;
  // The build spends more than the budget.
  over: boolean;
};

export type PointsSummaryOptions = {
  // Defaults to the max player level.
  playerLevel?: number;
  // Explored biome IDs (see BIOMES). Defaults to every biome, so with no
  // options the budget is that of a max-level player who explored everything.
  biomes?: string[];
  // Manual adjustment added to the budget (negative to remove points). Default 0.
  bonusPoints?: number;
};

// Points used, the budget and what's left, for a player level and explored biomes.
export const getPointsSummary = (
  selection: SkillSelection,
  { playerLevel = MAX_PLAYER_LEVEL, biomes = BIOMES.map((biome) => biome.id), bonusPoints = 0 }: PointsSummaryOptions = {},
  tree: SkillNodesType = SkillNodes
): PointsSummary => {
  const used = getPointsUsed(selection, tree);
  const max = getMaxSkillPoints({ playerLevel, unlockedBiomes: biomes, bonusPoints });
  return { used, max, left: max - used, full: used >= max, over: used > max };
};
