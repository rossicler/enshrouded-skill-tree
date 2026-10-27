import { useMemo } from "react";
import {
  getPointsSummary,
  getSearchCorpus,
  getTotalStats,
  searchSkills,
  type PointsSummary,
  type PointsSummaryOptions,
  type SkillSearchResult,
  type SkillSelection,
  type StatTotals,
} from "@enshrouded/core";

// Points used, the budget and what's left. With no options the budget is a
// max-level player's who explored every biome.
export const usePoints = (
  selection: SkillSelection,
  { playerLevel, biomes, bonusPoints }: PointsSummaryOptions = {}
): PointsSummary => {
  // A biome list rebuilt on every render shouldn't recompute anything.
  const biomesKey = biomes?.join("\n");
  return useMemo(
    () => getPointsSummary(selection, { playerLevel, biomes, bonusPoints }),
    [selection, playerLevel, biomesKey, bonusPoints]
  );
};

// Attribute points from the selected skills plus the flame altar.
export const useStats = (selection: SkillSelection, flameLevel = 1): StatTotals =>
  useMemo(() => getTotalStats(selection, flameLevel), [selection, flameLevel]);

export type SkillSearchState = {
  // Matching skill types, best first (see searchSkills in @enshrouded/core).
  results: SkillSearchResult[];
  // The matching types, for SkillTreeView's or SkillTreeCard's highlightedTypes.
  // The same array until the results change, so the tree doesn't re-render.
  highlightedTypes: string[];
};

// Skills matching `query` in `locale`. Queries under 3 letters match nothing.
// `exact` keeps only skills named exactly `query`.
export const useSkillSearch = (query: string, locale: string, { exact = false }: { exact?: boolean } = {}): SkillSearchState => {
  const corpus = useMemo(() => getSearchCorpus(locale), [locale]);
  return useMemo(() => {
    const results = searchSkills(query, locale, { exact, corpus });
    return { results, highlightedTypes: results.map((result) => result.key) };
  }, [query, locale, exact, corpus]);
};
