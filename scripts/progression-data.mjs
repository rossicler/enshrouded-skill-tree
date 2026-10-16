import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PROGRESSION_PATH = "packages/core/src/constants/gameProgression.json";

// The game region a skill point source belongs to, from the region the
// designers gave its entity template: Loot_Node_..._SkillPointPlant_04_desert
// -> "desert". Variants (_farculling, _nonmodalhint_08) keep their region.
export function regionOfTemplate(name) {
  return /SkillPointPlant_\d+_([a-z]+)/i.exec(name ?? "")?.[1].toLowerCase();
}

// Biome map names that template names spell differently.
const MAP_REGION_ALIASES = { steppes: "steppe", talltrees: "tralltrees" };

// Reduces a toolkit progression export (tools/progression) to the app's
// skill point budget: leveling values and points per app biome. `regions`
// maps game regions to app biome IDs (scripts/progression-regions.json).
export function runProgressionImport({ data, regions, previous }) {
  const blockers = [];
  if (!/^1\./.test(data.schemaVersion ?? "")) blockers.push(`Unsupported progression schema ${data.schemaVersion}`);
  const { playerLevelCap, skillPointsPerLevel } = data.leveling ?? {};
  if (!(playerLevelCap > 1) || !(skillPointsPerLevel > 0)) blockers.push("The export has no leveling values");

  const biomes = Object.fromEntries([...new Set(Object.values(regions))].map((id) => [id, { points: 0, unlocks: 0 }]));
  const unmapped = {};
  const borders = [];
  for (const unlock of data.skillPointUnlocks ?? []) {
    const region = regionOfTemplate(unlock.templateName);
    const biome = regions[region];
    if (!biome) {
      unmapped[region ?? unlock.templateName] = (unmapped[region ?? unlock.templateName] ?? 0) + unlock.amount;
      continue;
    }
    biomes[biome].points += unlock.amount;
    biomes[biome].unlocks += 1;
    // Counted by template region; note where the biome map disagrees.
    const mapRegion = unlock.mapRegion?.toLowerCase();
    const mapBiome = regions[MAP_REGION_ALIASES[mapRegion] ?? mapRegion];
    if (mapBiome && mapBiome !== biome) borders.push({ knowledgeId: unlock.knowledgeId, template: region, mapRegion: unlock.mapRegion, biome, mapBiome });
  }
  for (const [region, points] of Object.entries(unmapped)) {
    blockers.push(`Game region ${region} (${points} points) has no app biome in scripts/progression-regions.json`);
  }
  const sources = (data.skillPointSources ?? []).reduce((sum, source) => sum + source.amount, 0);
  const counted = Object.values(biomes).reduce((sum, biome) => sum + biome.points, 0);
  if (!Object.keys(unmapped).length && sources !== counted) blockers.push(`Sources grant ${sources} points but placed unlocks ${counted}`);

  const candidate = {
    schemaVersion: "1.0.0",
    provenance: { gameBuild: data.provenance?.gameBuild, exportedAtUtc: data.provenance?.exportedAtUtc,
      sourceFileSha256: data.provenance?.sourceFileSha256 },
    leveling: { playerLevelCap, skillPointsPerLevel },
    biomes,
  };
  const report = {
    gameBuild: candidate.provenance.gameBuild,
    previousGameBuild: previous?.provenance?.gameBuild,
    leveling: { previous: previous?.leveling, next: candidate.leveling },
    biomes: Object.fromEntries(Object.entries(biomes).map(([id, next]) => [id, { previous: previous?.biomes?.[id], next }])),
    totals: {
      leveling: (playerLevelCap - 1) * skillPointsPerLevel,
      exploration: counted,
      max: (playerLevelCap - 1) * skillPointsPerLevel + counted,
    },
    borders,
  };
  return { candidate, report, blockers };
}

export function summarizeProgression({ report, blockers }) {
  const lines = ["# Skill point progression preview", "",
    `- Game build: ${report.gameBuild} (previous: ${report.previousGameBuild ?? "none"})`,
    `- Leveling: ${JSON.stringify(report.leveling.previous ?? null)} -> ${JSON.stringify(report.leveling.next)}`,
    `- Max skill points: ${report.totals.leveling} leveling + ${report.totals.exploration} exploration = ${report.totals.max}`, "",
    "## Biomes (points, unlocks)", ""];
  for (const [id, { previous, next }] of Object.entries(report.biomes)) {
    const before = previous ? `${previous.points} (${previous.unlocks})` : "new";
    lines.push(`- ${id}: ${before} -> ${next.points} (${next.unlocks})`);
  }
  lines.push("", "## Border placements (counted by template region)", "");
  for (const item of report.borders) lines.push(`- ${item.knowledgeId}: ${item.template} template in ${item.mapRegion} cells -> counted in ${item.biome}`);
  if (!report.borders.length) lines.push("- none");
  lines.push("", "## Blockers", "");
  for (const blocker of blockers) lines.push(`- ${blocker}`);
  if (!blockers.length) lines.push("- none");
  return lines.join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const input = process.argv[2];
  if (!input) throw new Error("Usage: node scripts/progression-data.mjs <progression.json> [--apply]");
  const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8").replace(/^﻿/, ""));
  const target = path.join(root, PROGRESSION_PATH);
  const output = path.join(root, ".local/progression");
  const result = runProgressionImport({
    data: readJson(input),
    regions: readJson(path.join(root, "scripts/progression-regions.json")),
    previous: fs.existsSync(target) ? readJson(target) : undefined,
  });
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, "candidate.json"), JSON.stringify(result.candidate, null, 2) + "\n");
  fs.writeFileSync(path.join(output, "summary.md"), summarizeProgression(result) + "\n");
  console.log(summarizeProgression(result));
  if (process.argv.includes("--apply")) {
    if (result.blockers.length) {
      console.error("\nApply refused; resolve the blockers above.");
      process.exit(1);
    }
    fs.writeFileSync(target, JSON.stringify(result.candidate, null, 2) + "\n");
    console.log(`\nApplied: ${PROGRESSION_PATH} updated.`);
  }
}
