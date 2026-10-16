import { describe, expect, it } from "vitest";
import { regionOfTemplate, runProgressionImport, summarizeProgression } from "./progression-data.mjs";
import regions from "./progression-regions.json";
import committed from "../packages/core/src/constants/gameProgression.json";

const plant = (region, variant = "") => `Loot_Node_Well_Core_Object_SkillPointPlant_01_${region}${variant}`;
const unlock = (knowledgeId, amount, templateName, mapRegion) => ({ knowledgeId, amount, templateName, mapRegion });
const exportOf = (unlocks, leveling = { playerLevelCap: 50, skillPointsPerLevel: 2 }) => ({
  schemaVersion: "1.0.0",
  provenance: { gameBuild: "2|test", exportedAtUtc: "2026-10-16T00:00:00Z" },
  leveling,
  skillPointSources: unlocks.map(({ knowledgeId, amount }) => ({ knowledgeId, amount })),
  skillPointUnlocks: unlocks,
});

describe("progression import", () => {
  it("reads the designer region from root and well templates, including variants", () => {
    expect(regionOfTemplate(plant("grassland"))).toBe("grassland");
    expect(regionOfTemplate(plant("steppe", "_farculling"))).toBe("steppe");
    expect(regionOfTemplate(plant("grassland", "_nonmodalhint_08"))).toBe("grassland");
    expect(regionOfTemplate("LootContainer_Something_Else")).toBeUndefined();
  });

  it("totals points per app biome by template region and reports border placements", () => {
    const data = exportOf([
      unlock("1", 1, plant("grassland"), "Grassland"),
      unlock("2", 3, plant("grassland"), "Grassland"),
      unlock("3", 1, plant("tralltrees"), "TallTrees"),
      unlock("4", 1, plant("deepforest"), "Grassland"),
    ]);
    const { candidate, report, blockers } = runProgressionImport({ data, regions });
    expect(blockers).toEqual([]);
    expect(candidate.leveling).toEqual({ playerLevelCap: 50, skillPointsPerLevel: 2 });
    expect(candidate.biomes.springlands).toEqual({ points: 4, unlocks: 2 });
    expect(candidate.biomes.revelwood).toEqual({ points: 2, unlocks: 2 });
    expect(candidate.biomes.cinders_cradle).toEqual({ points: 0, unlocks: 0 });
    expect(report.totals).toEqual({ leveling: 98, exploration: 6, max: 104 });
    expect(report.borders).toEqual([{ knowledgeId: "4", template: "deepforest", mapRegion: "Grassland", biome: "revelwood", mapBiome: "springlands" }]);
    expect(summarizeProgression({ report, blockers })).toContain("4: deepforest template in Grassland cells -> counted in revelwood");
  });

  it("blocks an unmapped game region, missing leveling and an unsupported schema", () => {
    const data = exportOf([unlock("1", 1, plant("moonland"), "Moonland")], {});
    data.schemaVersion = "2.0.0";
    expect(runProgressionImport({ data, regions }).blockers).toEqual([
      "Unsupported progression schema 2.0.0",
      "The export has no leveling values",
      "Game region moonland (1 points) has no app biome in scripts/progression-regions.json",
    ]);
  });

  it("blocks when the placed unlocks do not account for every source", () => {
    const data = exportOf([unlock("1", 1, plant("grassland"), "Grassland")]);
    data.skillPointSources.push({ knowledgeId: "2", amount: 3 });
    expect(runProgressionImport({ data, regions }).blockers).toEqual(["Sources grant 4 points but placed unlocks 1"]);
  });

  it("covers every mapped biome in the committed data", () => {
    expect(Object.keys(committed.biomes).sort()).toEqual([...new Set(Object.values(regions))].sort());
    expect(committed.provenance.gameBuild).toMatch(/^1267041\|/);
  });
});
