import progression from "./gameProgression.json";

export interface Biome {
  id: string;
  minLevel: number;
  maxLevel: number;
  explorationPoints: number; // Shroud Roots SP + Elixir Wells SP
}

// Leveling and exploration points come from the game (gameProgression.json,
// imported with `yarn import-progression`): each level after the first grants
// skillPointsPerLevel, and each biome the points of its Shroud Roots (1) and
// Elixir Wells (3). Game regions map to these biomes in
// scripts/progression-regions.json. Level ranges and order are app-owned.
export const SP_PER_LEVEL = progression.leveling.skillPointsPerLevel;
export const MAX_PLAYER_LEVEL = progression.leveling.playerLevelCap;
// The flame level a player can reach, from the game's flame upgrade recipes.
// The flame starts at level 1.
export const MAX_FLAME_LEVEL = progression.flame.flameLevelCap;

export function clampFlameLevel(level: number): number {
  if (!Number.isFinite(level)) return 1;
  return Math.max(1, Math.min(MAX_FLAME_LEVEL, Math.floor(level)));
}

const BIOME_LEVELS: Omit<Biome, "explorationPoints">[] = [
  { id: "springlands",      minLevel: 2,  maxLevel: 10 },
  { id: "revelwood",        minLevel: 11, maxLevel: 15 },
  { id: "nomad_highlands",  minLevel: 16, maxLevel: 20 },
  { id: "kindlewastes",     minLevel: 21, maxLevel: 30 },
  { id: "albaneve_summits", minLevel: 31, maxLevel: 40 },
  { id: "veilwater_basin",  minLevel: 41, maxLevel: 45 },
  { id: "cinders_cradle",   minLevel: 46, maxLevel: 50 },
];

const biomePoints: Record<string, { points: number }> = progression.biomes;

export const BIOMES: Biome[] = BIOME_LEVELS.map((biome) => ({
  ...biome,
  explorationPoints: biomePoints[biome.id]?.points ?? 0,
}));

export function computeLevelingPoints(playerLevel: number): number {
  return Math.max(0, Math.min(playerLevel, MAX_PLAYER_LEVEL) - 1) * SP_PER_LEVEL;
}

export function computeMaxSkillPoints(
  playerLevel: number,
  unlockedBiomes: string[] | undefined
): number {
  const levelingSP = computeLevelingPoints(playerLevel);
  const explorationSP = BIOMES
    .filter((b) => unlockedBiomes?.includes(b.id))
    .reduce((acc, b) => acc + b.explorationPoints, 0);
  return levelingSP + explorationSP;
}

export const MAX_SKILL_POINTS_ABSOLUTE = computeMaxSkillPoints(MAX_PLAYER_LEVEL, BIOMES.map((b) => b.id));
