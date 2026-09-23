import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Evaluate only this repository's authored TypeScript seed, never game data.
export function loadAuthoredTree() {
  const filename = path.join(root, "src/constants/LegacyNodes.ts");
  const source = fs.readFileSync(filename, "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  new Function("exports", "require", "process", code)(exports, createRequire(filename), process);
  return exports.default;
}

const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

export function matchNodes(data, app, locale) {
  if (data.schemaVersion !== "1.0.0" || !Array.isArray(data.issues) || data.issues.length || data.raw.trees.length !== 1 || !data.provenance?.gameBuild) {
    throw new Error("Expected one validated schema 1.0.0 skill tree");
  }
  const raw = data.raw.trees[0].data;
  const allIds = new Set(raw.nodes.map((node) => String(node.id.value)));
  if (allIds.size !== raw.nodes.length) throw new Error("Duplicate source node IDs");
  const texts = new Map(data.interpreted.nodes.map((node) => [node.gameNodeId, node]));
  if (texts.size !== raw.nodes.length || raw.nodes.some((node) => !texts.has(String(node.id.value)))) throw new Error("Missing/duplicate interpreted identities");
  const nodes = raw.nodes.filter((node) => node.type !== "Root");
  const ids = new Set(nodes.map((node) => String(node.id.value)));
  const neighbors = Object.fromEntries(nodes.map((node) => [String(node.id.value), new Set()]));
  const base = new Set();
  for (const link of raw.links) {
    const a = String(link.sourceNode.value), b = String(link.targetNode.value);
    if (!allIds.has(a) || !allIds.has(b)) throw new Error("Dangling source graph endpoint");
    if (ids.has(a) && ids.has(b)) { neighbors[a].add(b); neighbors[b].add(a); }
    else if (ids.has(a)) base.add(a);
    else if (ids.has(b)) base.add(b);
  }
  const candidates = Object.fromEntries(nodes.map((node) => {
    const id = String(node.id.value);
    const name = normalize(texts.get(id).texts.name.template);
    return [id, Object.values(app.nodes).filter((other) => {
      const names = [other.type, locale[other.type]?.name, app.types[other.type].name].filter(Boolean);
      return names.some((value) => normalize(value) === name)
        || (id === "2877196577" && other.type === "HEALER_REVIVE");
    }).map((other) => other.id)];
  }));
  // Propagate already unique neighbor matches to disambiguate repeated names.
  // No nearest-position fallback: ambiguous placements must remain explicit.
  let changed = true;
  while (changed) {
    changed = false;
    const unique = new Set(Object.values(candidates).filter((list) => list.length === 1).flat());
    for (const node of nodes) {
      const id = String(node.id.value), before = candidates[id];
      if (before.length <= 1) continue;
      const after = before.filter((candidate) => {
        if (before.length > 1 && unique.has(candidate)) return false;
        if (Boolean(app.nodes[candidate].base) !== base.has(id)) return false;
        return [...neighbors[id]].filter((neighbor) => candidates[neighbor].length === 1)
          .every((neighbor) => app.edges[candidate].includes(candidates[neighbor][0]));
      });
      if (after.length && after.length !== before.length) { candidates[id] = after; changed = true; }
    }
  }
  return { candidates, nodes, texts, neighbors, base };
}

export function inspect(data, app, locale) {
  const match = matchNodes(data, app, locale);
  const mapping = Object.fromEntries(Object.entries(match.candidates).filter(([, ids]) => ids.length === 1)
    .map(([gameId, [appId]]) => [gameId, { appId, type: app.nodes[appId].type }]));
  const unresolved = Object.entries(match.candidates).filter(([, ids]) => ids.length !== 1)
    .map(([gameId, candidates]) => ({ gameId, name: match.texts.get(gameId).texts.name.template, candidates }));
  const mappedIds = Object.values(mapping).map((entry) => entry.appId);
  const duplicateAppIds = mappedIds.filter((id, index) => mappedIds.indexOf(id) !== index);
  const edgeKey = (a, b) => [a, b].sort().join("-");
  const gameEdges = new Set([...Object.entries(match.neighbors)].flatMap(([id, neighbors]) =>
    [...neighbors].filter((other) => mapping[id] && mapping[other]).map((other) => edgeKey(mapping[id].appId, mapping[other].appId))));
  const appEdges = new Set(Object.entries(app.edges).flatMap(([id, neighbors]) => neighbors.map((other) => edgeKey(id, other))));
  const graphDifferences = {
    gameOnly: [...gameEdges].filter((edge) => !appEdges.has(edge)),
    appOnly: [...appEdges].filter((edge) => !gameEdges.has(edge)),
    base: [
      ...[...match.base].filter((id) => !mapping[id] || !app.nodes[mapping[id].appId].base),
      ...Object.values(app.nodes).filter((node) => node.base && ![...match.base].some((id) => mapping[id]?.appId === node.id)).map((node) => `app:${node.id}`),
    ],
  };
  return { gameBuild: data.provenance.gameBuild, mapping, unresolved, duplicateAppIds, graphDifferences };
}

export function formatValue(value, format, signed = false) {
  if (!Number.isFinite(value)) throw new Error("Non-finite numeric argument");
  const clean = (n) => String(Number(n.toPrecision(7)));
  const sign = signed && value > 0 ? "+" : "";
  if (format === "Normal") return sign + clean(value);
  if (format === "Percentage") return sign + clean(value * 100) + "%";
  if (format === "Duration") return sign + clean(value) + " seconds";
  throw new Error(`Unsupported value format: ${format}`);
}

export function resolveArgument(argument, node, interpreted, data, level, inputLabels = {}) {
  if (argument.type === "Input") {
    if (!inputLabels[argument.id]) throw new Error(`Input action ${argument.id} needs a display label`);
    return inputLabels[argument.id];
  }
  if (argument.type === "Balancing") {
    const field = { 0: "playerHealthPerAP", 1: "playerManaPerAP", 2: "playerStaminaPerAP" }[argument.id];
    if (!field || data.raw.balancing.length !== 1) throw new Error(`Unknown balancing argument ${argument.id}`);
    return formatValue(data.raw.balancing[0].data[field], "Normal");
  }
  if (argument.type !== "Config") throw new Error(`Unknown argument type ${argument.type}`);
  const entries = ["simple", "scaled"].flatMap((group) => node.configValues[group].map((config, i) =>
    ({ ...config, sourcePath: `configValues.${group}[${i + 1}]` })));
  const matches = entries.filter((config) => config.value.configId.value === argument.id);
  if (matches.length !== 1) throw new Error(`Expected one config for ${argument.id}`);
  const config = matches[0], value = config.value;
  const numeric = /^keen::impact::(?:Scaled)?(?:Float|Sint32|Uint32)ImpactConfig$/;
  if (!numeric.test(config.variantType)) throw new Error(`Unsupported numeric config ${config.variantType}`);
  let result = value.value;
  if (config.sourcePath.includes(".scaled")) {
    const effect = interpreted.effects.find((effect) => effect.sourcePath === config.sourcePath);
    if (value.function !== "Linear" || effect?.sourceAttribute?.name !== "Level" || value.source.sourceEntity !== "Self") {
      throw new Error(`Unsupported scaling source/function for ${argument.id}`);
    }
    result += value.scaleFactor * level;
  }
  return formatValue(result, value.valueFormat, value.isSigned);
}

export function renderText(text, node, interpreted, data, level, inputLabels) {
  if (text.status === "absent") return undefined;
  if (text.status !== "resolved-template") throw new Error("Unresolved localization template");
  let index = 0;
  const rendered = text.template.replace(/%%|%k/g, (token) => {
    if (token === "%%") return "%";
    const argument = text.arguments[index++];
    if (!argument) throw new Error("Missing placeholder argument");
    return resolveArgument(argument, node, interpreted, data, level, inputLabels);
  });
  if (index !== text.arguments.length) throw new Error("Unused placeholder arguments");
  if (/%[a-z]/i.test(rendered)) throw new Error("Unknown text placeholder");
  return rendered.trim().split(/\n\s*\n/).map((paragraph) => paragraph.trim().replace(/\n/g, "<br/>"));
}

export function buildTextTemplate(text, node, interpreted, data, maxLevel, inputLabels, keyPrefix = "gameValue") {
  if (text.status === "absent") return undefined;
  if (text.status !== "resolved-template") throw new Error("Unresolved localization template");
  const values = {};
  let index = 0;
  const rendered = text.template.replace(/%%|%k/g, (token) => {
    if (token === "%%") return "%";
    const argument = text.arguments[index++];
    if (!argument) throw new Error("Missing placeholder argument");
    const key = `${keyPrefix}${index}`;
    values[key] = Array.from({ length: maxLevel }, (_, level) =>
      resolveArgument(argument, node, interpreted, data, level + 1, inputLabels));
    return `{{${key}}}`;
  });
  if (index !== text.arguments.length) throw new Error("Unused placeholder arguments");
  if (/%[a-z]/i.test(rendered)) throw new Error("Unknown text placeholder");
  return {
    template: rendered.trim().split(/\n\s*\n/).map((paragraph) => paragraph.trim().replace(/\n/g, "<br/>")),
    values,
  };
}

export function buildCandidate(data, app, locale, inputLabels = {}) {
  const report = inspect(data, app, locale);
  if (report.unresolved.length || report.duplicateAppIds.length ||
      Object.values(report.graphDifferences).some((list) => list.length) ||
      Object.keys(report.mapping).length !== Object.keys(app.nodes).length) {
    throw new Error(`Identity/topology mismatch; review mapping report: ${JSON.stringify(report)}`);
  }
  const raw = data.raw.trees[0].data;
  const roots = raw.nodes.filter((node) => node.type === "Root");
  const center = {
    x: roots.reduce((sum, node) => sum + node.uiPosition.x, 0) / roots.length,
    y: roots.reduce((sum, node) => sum + node.uiPosition.y, 0) / roots.length,
  };
  const scale = 198 / (roots.reduce((sum, node) => sum + Math.hypot(node.uiPosition.x - center.x, node.uiPosition.y - center.y), 0) / roots.length);
  if (!Number.isFinite(scale) || scale <= 0) throw new Error("Invalid game root geometry");
  const xy = (position) => {
    if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) throw new Error("Invalid game coordinates");
    return { x: (position.x - center.x) * scale, y: (position.y - center.y) * scale };
  };
  const rootById = new Map(roots.map((node) => [String(node.id.value), node]));
  const anchors = {};
  for (const link of raw.links) {
    const a = String(link.sourceNode.value), b = String(link.targetNode.value);
    const rootId = rootById.has(a) ? a : rootById.has(b) ? b : undefined;
    if (rootId) {
      const skill = rootId === a ? b : a;
      if (anchors[skill]) throw new Error(`Multiple root anchors for ${skill}`);
      anchors[skill] = xy(rootById.get(rootId).uiPosition);
    }
  }
  const texts = new Map(data.interpreted.nodes.map((node) => [node.gameNodeId, node]));
  const candidate = { schemaVersion: "1.0.0", provenance: data.provenance, transform: { center, scale }, nodes: {}, types: {}, english: {} };
  report.unresolvedText = [];
  report.retainedText = [];
  report.retainedStats = [];
  report.changes = [];
  for (const node of raw.nodes.filter((node) => node.type !== "Root")) {
    const gameId = String(node.id.value), { appId, type } = report.mapping[gameId];
    const interpreted = texts.get(gameId), original = app.types[type];
    const metadata = { cost: node.costs, maxLevel: interpreted.maxPurchasableLevel };
    const statKeys = {
      "0b1ceec5-402d-43ff-9a12-43392d53cf26": "CONS",
      "4be83310-d59c-4f6d-89dd-1e61e033db86": "DEX",
      "6bd1a147-1ea7-441e-8c6e-6f8b68dbcbfe": "ENDURANCE",
      "2609852d-a281-4176-804e-b2dc4b8eb8e8": "INT",
      "0e31beac-22c5-4572-a98a-e39dca2bd1f7": "SPIRIT",
      "64810163-59a0-4b55-82b9-5bb6290b22d7": "STR",
    };
    const attribute = node.configValues.simple.find((config) => config.variantType === "keen::impact::AttributeReferenceConfig" && statKeys[config.value.value]);
    if (node.type === "Attribute" && attribute) {
      const increment = node.configValues.simple.find((config) => config.variantType === "keen::impact::Sint32ImpactConfig" && config.value.configId.value === 168593383);
      if (!Number.isFinite(increment?.value.value) || node.configValues.scaled.length) throw new Error(`Unsupported attribute increment ${gameId}`);
      metadata.stats = { [statKeys[attribute.value.value]]: increment.value.value };
      if (JSON.stringify(original.stats) !== JSON.stringify(metadata.stats)) throw new Error(`Basic stat change needs review: ${gameId}`);
    } else if (original.stats) {
      if (node.type === "Attribute") throw new Error(`Missing basic stat configuration: ${gameId}`);
      report.retainedStats.push({ appId, gameId, type, stats: original.stats, reason: "Effect-program stat contribution remains app-owned" });
    }
    if (!Number.isInteger(metadata.cost) || metadata.cost < 0 || !Number.isInteger(metadata.maxLevel) || metadata.maxLevel < 1) throw new Error(`Invalid cost/levels for ${gameId}`);
    candidate.nodes[appId] = { gameNodeId: gameId, position: { kind: "cartesian", ...xy(node.uiPosition) }, ...(anchors[gameId] ? { baseAnchor: anchors[gameId] } : {}) };
    if (original.cost !== metadata.cost || (original.maxLevel ?? 1) !== metadata.maxLevel) {
      report.changes.push({ appId, type, before: { cost: original.cost, maxLevel: original.maxLevel ?? 1 }, after: metadata });
    }
    try {
      const description = buildTextTemplate(interpreted.texts.description, node, interpreted, data, metadata.maxLevel, inputLabels);
      const perLevelLabel = buildTextTemplate(interpreted.texts.perLevelEffectDescription, node, interpreted, data, 1, inputLabels, "gamePerLevelValue");
      const english = {
        name: interpreted.texts.name.template,
        description: description.template,
        ...(perLevelLabel ? { perLevelLabel: perLevelLabel.template.join("<br/>") } : {}),
      };
      metadata.gameValues = {};
      metadata.gameLevelValues = {};
      for (const [key, levelValues] of Object.entries(description.values)) {
        if (levelValues.every((value) => value === levelValues[0])) metadata.gameValues[key] = levelValues[0];
        else metadata.gameLevelValues[key] = levelValues;
      }
      if (!Object.keys(metadata.gameValues).length) delete metadata.gameValues;
      if (!Object.keys(metadata.gameLevelValues).length) delete metadata.gameLevelValues;
      const perLevelValues = Object.fromEntries(Object.entries(perLevelLabel?.values ?? {})
        .map(([key, values]) => [key, values[0]]));
      if (Object.keys(perLevelValues).length) metadata.gamePerLevelValues = perLevelValues;
      if (candidate.english[type] && JSON.stringify(candidate.english[type]) !== JSON.stringify(english)) throw new Error(`Conflicting shared text ${type}`);
      candidate.english[type] = english;
    } catch (error) {
      const entry = { appId, gameId, type, reason: error.message };
      // Deliberate, narrow compatibility exception; never infer time math.
      if (gameId === "712870937" && error.message === "Unsupported numeric config keen::impact::ScaledTimeImpactConfig") {
        report.retainedText.push(entry);
      } else report.unresolvedText.push(entry);
    }
    if (candidate.types[type] && JSON.stringify(candidate.types[type]) !== JSON.stringify(metadata)) throw new Error(`Conflicting shared type ${type}`);
    candidate.types[type] = metadata;
  }
  return { report, candidate };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const input = process.argv[2];
  if (!input) throw new Error("Usage: node scripts/skill-data.mjs <skill-data.json>");
  const data = JSON.parse(fs.readFileSync(input, "utf8"));
  const locale = JSON.parse(fs.readFileSync(path.join(root, "public/locales/en/nodes.json"), "utf8"));
  const app = loadAuthoredTree();
  const options = process.argv.slice(3);
  const labelsPath = options.find((arg) => arg.startsWith("--inputs="))?.slice(9);
  const labels = JSON.parse(fs.readFileSync(labelsPath ?? path.join(root, "scripts/skill-data-inputs.json"), "utf8"));
  const result = buildCandidate(data, app, locale, labels);
  const output = path.join(root, ".local/skill-data");
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, "report.json"), JSON.stringify(result.report, null, 2) + "\n");
  fs.writeFileSync(path.join(output, "candidate.json"), JSON.stringify(result.candidate, null, 2) + "\n");
  const mappingPath = path.join(root, "scripts/skill-data-mapping.json");
  if (options.includes("--initialize-mapping")) {
    if (fs.existsSync(mappingPath)) throw new Error("Mapping already exists; refusing to replace checked identities");
    fs.writeFileSync(mappingPath, JSON.stringify(result.report.mapping, null, 2) + "\n");
  } else if (fs.existsSync(mappingPath)) {
    const saved = JSON.parse(fs.readFileSync(mappingPath, "utf8"));
    if (JSON.stringify(saved) !== JSON.stringify(result.report.mapping)) throw new Error("Checked mapping changed; review identities before import");
  }
  if (options.includes("--apply")) {
    if (!fs.existsSync(mappingPath)) throw new Error("Initialize and review the identity mapping first");
    if (result.report.unresolvedText.length) throw new Error("Unresolved text prevents applying this import; see report.json");
    const { english, ...runtime } = result.candidate;
    for (const [type, metadata] of Object.entries(runtime.types)) {
      metadata.importedEnglish = Boolean(english[type]);
      if (english[type]) {
        metadata.name = english[type].name;
        metadata.description = english[type].description;
      }
      // Keep existing translations and their interpolation intact for other locales.
      locale[type] ??= {};
      delete locale[type].game;
      if (english[type]) locale[type].game = english[type];
    }
    fs.writeFileSync(path.join(root, "src/constants/gameSkillData.json"), JSON.stringify(runtime, null, 2) + "\n");
    fs.writeFileSync(path.join(root, "public/locales/en/nodes.json"), JSON.stringify(locale, null, 2) + "\n");
  }
  console.log(JSON.stringify({ output, mappedNodes: Object.keys(result.report.mapping).length, graphDifferences: result.report.graphDifferences,
    changes: result.report.changes, retainedText: result.report.retainedText, retainedStats: result.report.retainedStats, unresolvedText: result.report.unresolvedText }, null, 2));
}
