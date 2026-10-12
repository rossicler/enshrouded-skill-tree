export interface Biome {
  id: string;
  minLevel: number;
  maxLevel: number;
  explorationPoints: number; // Shroud Roots SP + Elixir Wells SP
}

// SP per level = 2 (each level from 2 onward grants 2 SP)
// Leveling totals per biome: Springlands 18, Revelwood 10, Nomad 10, Kindle 20, Albaneve 20, Veil 10 → 88 total
// Exploration totals: roots(6+9+6+6+6+6=39) + wells(9+9+9+12+9+9=57) = 96 total
// Grand total: 88 + 96 = 184
export const SP_PER_LEVEL = 2;
export const MAX_PLAYER_LEVEL = 45;
export const MAX_SKILL_POINTS_ABSOLUTE = 184;

export const BIOMES: Biome[] = [
  { id: "springlands",      minLevel: 2,  maxLevel: 10, explorationPoints: 15 }, // 6 roots + 9 wells
  { id: "revelwood",        minLevel: 11, maxLevel: 15, explorationPoints: 18 }, // 9 roots + 9 wells
  { id: "nomad_highlands",  minLevel: 16, maxLevel: 20, explorationPoints: 15 }, // 6 roots + 9 wells
  { id: "kindlewastes",     minLevel: 21, maxLevel: 30, explorationPoints: 18 }, // 6 roots + 12 wells
  { id: "albaneve_summits", minLevel: 31, maxLevel: 40, explorationPoints: 15 }, // 6 roots + 9 wells
  { id: "veilwater_basin",  minLevel: 41, maxLevel: 45, explorationPoints: 15 }, // 6 roots + 9 wells
];

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
