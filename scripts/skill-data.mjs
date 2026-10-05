import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Evaluate only this repository's authored TypeScript presentation, never game data.
export function loadAuthoredPresentation() {
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
export const compareIds = (a, b) => a.localeCompare(b, undefined, { numeric: true });
const sortedObject = (object, compare = compareIds) =>
  Object.fromEntries(Object.keys(object).sort(compare).map((key) => [key, object[key]]));

// Undirected, deduplicated and ordered: [low, high] pairs sorted by endpoint.
export function canonicalEdges(pairs) {
  const keys = new Set(pairs.map(([a, b]) => [a, b].sort(compareIds).join("|")));
  return [...keys].map((key) => key.split("|")).sort((x, y) => compareIds(x[0], y[0]) || compareIds(x[1], y[1]));
}

// Hash the imported tree content, not the export time, parser revision or game
// build. Key ordering in a source export must not create a new tree revision.
export function treeContentHash(content) {
  const canonical = (value) => Array.isArray(value) ? value.map(canonical)
    : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort()
      .map((key) => [key, canonical(value[key])])) : value;
  return createHash("sha256").update(JSON.stringify(canonical(content))).digest("hex");
}

export const candidateContentHash = ({ nodes, edges, types, english }) =>
  treeContentHash({ nodes, edges, types, english });

// The checked identity file. Version 1 was a bare { gameId: { appId, type } } map.
export function normalizeMapping(mapping) {
  if (!mapping) return { nodes: {}, retired: {} };
  if (!mapping.nodes) return { nodes: mapping, retired: {} };
  return { nodes: mapping.nodes, retired: mapping.retired ?? {} };
}

// Validate the export's shape and index its graph. Links are directed in the
// game data; adjacency here is undirected, matching how unlocking works.
export function parseExport(data) {
  if (data.schemaVersion !== "1.0.0" || !Array.isArray(data.issues) || data.issues.length || data.raw.trees.length !== 1 || !data.provenance?.gameBuild) {
    throw new Error("Expected one validated schema 1.0.0 skill tree");
  }
  const raw = data.raw.trees[0].data;
  const allIds = new Set(raw.nodes.map((node) => String(node.id.value)));
  if (allIds.size !== raw.nodes.length) throw new Error("Duplicate source node IDs");
  const texts = new Map(data.interpreted.nodes.map((node) => [node.gameNodeId, node]));
  if (texts.size !== raw.nodes.length || raw.nodes.some((node) => !texts.has(String(node.id.value)))) throw new Error("Missing/duplicate interpreted identities");
  const nodes = raw.nodes.filter((node) => node.type !== "Root");
  const roots = raw.nodes.filter((node) => node.type === "Root");
  const ids = new Set(nodes.map((node) => String(node.id.value)));
  const neighbors = Object.fromEntries(nodes.map((node) => [String(node.id.value), new Set()]));
  const rootOf = {};
  for (const link of raw.links) {
    const a = String(link.sourceNode.value), b = String(link.targetNode.value);
    if (!allIds.has(a) || !allIds.has(b)) throw new Error("Dangling source graph endpoint");
    if (ids.has(a) && ids.has(b)) { neighbors[a].add(b); neighbors[b].add(a); }
    else if (ids.has(a) || ids.has(b)) {
      const skill = ids.has(a) ? a : b;
      if (rootOf[skill]) throw new Error(`Multiple root anchors for ${skill}`);
      rootOf[skill] = ids.has(a) ? b : a;
    }
  }
  const name = (gameId) => texts.get(gameId).texts.name.template;
  return { gameBuild: data.provenance.gameBuild, raw, nodes, roots, texts, neighbors, base: new Set(Object.keys(rootOf)), rootOf, name };
}

// The previous import as an app-shaped tree, for identity suggestions.
export function previousAppTree(previous, presentation) {
  const nodes = Object.fromEntries(Object.entries(previous.nodes).map(([id, node]) => [id, { id, type: node.type, base: Boolean(node.base) }]));
  const edges = Object.fromEntries(Object.keys(nodes).map((id) => [id, []]));
  for (const [a, b] of previous.edges) { edges[a]?.push(b); edges[b]?.push(a); }
  return { nodes, edges, types: presentation.types };
}

// Name + neighbor matching. Only used to initialize a mapping or to suggest a
// type for an unseen game ID; checked identities always come from the mapping.
export function matchNodes(data, app, locale) {
  const parsed = parseExport(data);
  const { nodes, texts, neighbors, base } = parsed;
  const candidates = Object.fromEntries(nodes.map((node) => {
    const id = String(node.id.value);
    const name = normalize(texts.get(id).texts.name.template);
    return [id, Object.values(app.nodes).filter((other) => {
      const names = [other.type, locale[other.type]?.name, app.types[other.type]?.name].filter(Boolean);
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
  return { candidates, ...parsed };
}

export function initialMapping(data, app, locale) {
  const match = matchNodes(data, app, locale);
  const nodes = Object.fromEntries(Object.entries(match.candidates).filter(([, ids]) => ids.length === 1)
    .map(([gameId, [appId]]) => [gameId, { appId, type: app.nodes[appId].type }]));
  const unresolved = Object.entries(match.candidates).filter(([, ids]) => ids.length !== 1)
    .map(([gameId, candidates]) => ({ gameId, name: match.name(gameId), candidates }));
  return { mapping: { nodes, retired: {} }, unresolved };
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

const TYPE_KEY = /^[A-Z][A-Z0-9_]*$/;
const APP_ID = /^[1-9]\d*$/;

// Compare an export with the checked mapping and the previous import, by
// stable game ID. Never throws for structural differences: they are reported,
// proposed as decisions, and gated on explicit approval.
export function planImport({ data, mapping: rawMapping, previous, presentation, locale, changes }) {
  const parsed = parseExport(data);
  const mapping = normalizeMapping(rawMapping);
  const blockers = [], warnings = [];
  const exportIds = parsed.nodes.map((node) => String(node.id.value)).sort(compareIds);
  const exportSet = new Set(exportIds);
  const previousName = (type) => locale[type]?.game?.name ?? locale[type]?.name ?? presentation.types[type]?.name ?? type;

  const kept = exportIds.filter((gameId) => mapping.nodes[gameId]);
  const added = exportIds.filter((gameId) => !mapping.nodes[gameId]);
  const removed = Object.keys(mapping.nodes).filter((gameId) => !exportSet.has(gameId)).sort(compareIds);
  const retiredByGameId = Object.fromEntries(Object.entries(mapping.retired).map(([appId, entry]) => [entry.gameId, appId]));

  const renamed = kept.filter((gameId) => normalize(parsed.name(gameId)) !== normalize(previousName(mapping.nodes[gameId].type)))
    .map((gameId) => ({ gameId, ...mapping.nodes[gameId], before: previousName(mapping.nodes[gameId].type), after: parsed.name(gameId) }));
  const removedInfo = removed.map((gameId) => ({ gameId, ...mapping.nodes[gameId], name: previousName(mapping.nodes[gameId].type) }));
  const possibleReIds = added.flatMap((gameId) => removedInfo.filter((entry) => normalize(entry.name) === normalize(parsed.name(gameId)))
    .map((entry) => ({ gameId, name: parsed.name(gameId), previousGameId: entry.gameId, appId: entry.appId })));

  // Proposed decisions: restore retired IDs for returning game IDs, reuse an app
  // ID only for an unambiguous same-name re-ID, otherwise allocate a new ID.
  const usedIds = [...Object.values(mapping.nodes).map((entry) => entry.appId), ...Object.keys(mapping.retired), ...Object.keys(previous.nodes)];
  let nextId = Math.max(0, ...usedIds.filter((id) => APP_ID.test(id)).map(Number)) + 1;
  const knownTypes = new Set([...Object.keys(presentation.types), ...Object.values(mapping.nodes).map((entry) => entry.type)]);
  const suggestType = (name) => {
    const existing = [...knownTypes].find((type) => normalize(previousName(type)) === normalize(name));
    if (existing) return existing;
    let key = name.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "NEW_SKILL";
    if (!/^[A-Z]/.test(key)) key = `SKILL_${key}`;
    for (let n = 2; knownTypes.has(key); n++) key = `${key.replace(/_\d+$/, "")}_${n}`;
    knownTypes.add(key);
    return key;
  };
  const proposal = { gameBuild: parsed.gameBuild, add: {}, reassign: {}, remove: [], retype: {} };
  const reIdCount = (list, key, value) => list.filter((entry) => entry[key] === value).length;
  for (const gameId of added) {
    const reId = possibleReIds.find((entry) => entry.gameId === gameId);
    if (retiredByGameId[gameId]) {
      const appId = retiredByGameId[gameId];
      proposal.add[gameId] = { appId, type: mapping.retired[appId].type };
    } else if (reId && reIdCount(possibleReIds, "gameId", gameId) === 1 && reIdCount(possibleReIds, "previousGameId", reId.previousGameId) === 1) {
      proposal.reassign[gameId] = reId.previousGameId;
    } else {
      proposal.add[gameId] = { appId: String(nextId++), type: suggestType(parsed.name(gameId)) };
    }
  }
  proposal.remove = removed.filter((gameId) => !Object.values(proposal.reassign).includes(gameId));

  // Effective decisions: the reviewed changes file when given, else the proposal
  // (previewed as-is, but any structural or graph change still needs approval).
  const source = changes ?? proposal;
  const decisions = {
    add: source.add ?? {}, reassign: source.reassign ?? {}, remove: source.remove ?? [], retype: source.retype ?? {},
  };
  if (changes && changes.gameBuild !== parsed.gameBuild) blockers.push(`Changes were approved for build ${changes.gameBuild}, not ${parsed.gameBuild}; review the new preview`);
  const structural = added.length || removed.length;
  if (structural && !changes) blockers.push("Structural changes need a reviewed changes file (start from changes.proposed.json)");

  const nextNodes = {};
  for (const gameId of kept) nextNodes[gameId] = { ...mapping.nodes[gameId] };
  const reassignTargets = Object.values(decisions.reassign);
  for (const [gameId, previousGameId] of Object.entries(decisions.reassign)) {
    if (!added.includes(gameId)) { blockers.push(`reassign: ${gameId} is not a new game ID`); continue; }
    if (!removed.includes(previousGameId)) { blockers.push(`reassign: ${previousGameId} is not a removed game ID`); continue; }
    if (reassignTargets.filter((id) => id === previousGameId).length > 1) { blockers.push(`reassign: ${previousGameId} is claimed more than once`); continue; }
    nextNodes[gameId] = { ...mapping.nodes[previousGameId] };
  }
  const nextRetired = { ...mapping.retired };
  for (const [gameId, entry] of Object.entries(decisions.add)) {
    if (!added.includes(gameId)) { blockers.push(`add: ${gameId} is not a new game ID`); continue; }
    if (decisions.reassign[gameId]) { blockers.push(`add: ${gameId} is also reassigned`); continue; }
    if (!APP_ID.test(entry?.appId ?? "")) { blockers.push(`add: ${gameId} needs a positive integer appId`); continue; }
    if (!TYPE_KEY.test(entry.type ?? "")) { blockers.push(`add: ${gameId} needs an UPPER_SNAKE type key`); continue; }
    if (mapping.retired[entry.appId]) {
      if (mapping.retired[entry.appId].gameId !== gameId) { blockers.push(`add: app ID ${entry.appId} is retired; never reuse it for another skill`); continue; }
      delete nextRetired[entry.appId];
    }
    nextNodes[gameId] = { appId: entry.appId, type: entry.type };
  }
  for (const gameId of added) if (!nextNodes[gameId]) blockers.push(`Undecided new game node ${gameId} (${parsed.name(gameId)})`);
  for (const gameId of removed) {
    if (reassignTargets.includes(gameId)) continue;
    if (!decisions.remove.includes(gameId)) { blockers.push(`Undecided removed game node ${gameId} (app ${mapping.nodes[gameId].appId})`); continue; }
    const { appId, type } = mapping.nodes[gameId];
    nextRetired[appId] = { gameId, type, name: previousName(type), build: parsed.gameBuild };
  }
  for (const gameId of decisions.remove) if (!removed.includes(gameId)) blockers.push(`remove: ${gameId} is not a removed game ID`);
  for (const [gameId, type] of Object.entries(decisions.retype)) {
    if (!nextNodes[gameId]) { blockers.push(`retype: ${gameId} is not a mapped game node`); continue; }
    if (!TYPE_KEY.test(type)) { blockers.push(`retype: ${type} is not an UPPER_SNAKE type key`); continue; }
    nextNodes[gameId].type = type;
  }
  const appIds = Object.values(nextNodes).map((entry) => entry.appId);
  for (const appId of new Set(appIds.filter((id, index) => appIds.indexOf(id) !== index))) blockers.push(`App ID ${appId} is assigned to more than one game node`);
  for (const appId of appIds) if (nextRetired[appId]) blockers.push(`App ID ${appId} is both active and retired`);

  // Graph differences in app-ID space. Unmapped game IDs appear as game:<id>.
  const appId = (gameId) => nextNodes[gameId]?.appId ?? `game:${gameId}`;
  const nextEdges = canonicalEdges(Object.entries(parsed.neighbors).flatMap(([a, list]) => [...list].map((b) => [appId(a), appId(b)])));
  const edgeKey = ([a, b]) => `${a}|${b}`;
  const previousEdges = canonicalEdges(previous.edges);
  const previousKeys = new Set(previousEdges.map(edgeKey)), nextKeys = new Set(nextEdges.map(edgeKey));
  const nextBase = [...parsed.base].map(appId).sort(compareIds);
  const previousBase = Object.keys(previous.nodes).filter((id) => previous.nodes[id].base).sort(compareIds);
  const graph = {
    added: nextEdges.filter((edge) => !previousKeys.has(edgeKey(edge))),
    removed: previousEdges.filter((edge) => !nextKeys.has(edgeKey(edge))),
    baseAdded: nextBase.filter((id) => !previousBase.includes(id)),
    baseRemoved: previousBase.filter((id) => !nextBase.includes(id)),
  };
  proposal.graph = graph;
  const graphChanged = Object.values(graph).some((list) => list.length);
  if (graphChanged && (!changes || JSON.stringify(changes.graph) !== JSON.stringify(graph))) {
    blockers.push("Graph or base-link changes are not approved exactly; copy the reviewed graph section from changes.proposed.json");
  }

  // Presentation is app-owned: new types need authored colors/icons first.
  const usedTypes = [...new Set(Object.values(nextNodes).map((entry) => entry.type))].sort();
  const missingPresentation = usedTypes.filter((type) => !presentation.types[type]);
  for (const type of missingPresentation) blockers.push(`Type ${type} needs authored presentation in src/constants/LegacyNodes.ts (color, icon/assets)`);
  for (const gameId of added) {
    const id = nextNodes[gameId]?.appId;
    if (id && !presentation.nodes[id]) warnings.push(`Node ${id} (${parsed.name(gameId)}) has no authored tier; it renders as "small"`);
  }
  for (const type of usedTypes) {
    if (presentation.types[type]?.hasIcon && !fs.existsSync(path.join(root, "public/assets/skills", `${type}.png`))) {
      warnings.push(`Type ${type} has hasIcon but public/assets/skills/${type}.png is missing`);
    }
  }

  const report = {
    gameBuild: parsed.gameBuild,
    previousGameBuild: previous.provenance?.gameBuild,
    counts: { exportNodes: exportIds.length, kept: kept.length, added: added.length, removed: removed.length },
    added: added.map((gameId) => ({ gameId, name: parsed.name(gameId), base: parsed.base.has(gameId),
      neighbors: [...parsed.neighbors[gameId]].map(appId).sort(compareIds) })),
    removed: removedInfo,
    possibleReIds,
    returning: added.filter((gameId) => retiredByGameId[gameId]).map((gameId) => ({ gameId, appId: retiredByGameId[gameId] })),
    renamed,
    graph,
  };
  const nextMapping = { nodes: sortedObject(nextNodes), retired: sortedObject(nextRetired) };
  return { parsed, report, proposal, nextMapping, blockers, warnings };
}

export function buildCandidate(data, parsed, nextMapping, previous, presentation, inputLabels = {}) {
  const { raw, roots } = parsed;
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
  const candidate = { schemaVersion: "1.0.0", provenance: data.provenance, transform: { center, scale }, nodes: {}, edges: [], retired: {}, types: {}, english: {} };
  const textReport = { unresolvedText: [], retainedText: [], retainedStats: [], changes: [], typeConflicts: [], nodeErrors: [] };
  const conflicted = new Set();
  for (const node of raw.nodes.filter((node) => node.type !== "Root")) {
    const gameId = String(node.id.value);
    if (!nextMapping.nodes[gameId]) continue; // undecided additions are reported by planImport
    const { appId, type } = nextMapping.nodes[gameId];
    const interpreted = parsed.texts.get(gameId);
    const original = { ...presentation.types[type], ...previous.types[type] };
    const isNewType = !previous.types[type];
    const metadata = { cost: node.costs, maxLevel: interpreted.maxPurchasableLevel };
    try {
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
        if (!isNewType && JSON.stringify(original.stats) !== JSON.stringify(metadata.stats)) throw new Error(`Basic stat change needs review: ${gameId}`);
      } else if (original.stats) {
        if (node.type === "Attribute") throw new Error(`Missing basic stat configuration: ${gameId}`);
        textReport.retainedStats.push({ appId, gameId, type, stats: original.stats, reason: "Effect-program stat contribution remains app-owned" });
      }
      if (!Number.isInteger(metadata.cost) || metadata.cost < 0 || !Number.isInteger(metadata.maxLevel) || metadata.maxLevel < 1) throw new Error(`Invalid cost/levels for ${gameId}`);
    } catch (error) {
      textReport.nodeErrors.push({ appId, gameId, type, reason: error.message });
      continue;
    }
    const anchor = parsed.rootOf[gameId] ? xy(rootById.get(parsed.rootOf[gameId]).uiPosition) : undefined;
    candidate.nodes[appId] = { gameNodeId: gameId, type, ...(anchor ? { base: true } : {}), position: { kind: "cartesian", ...xy(node.uiPosition) }, ...(anchor ? { baseAnchor: anchor } : {}) };
    if (!isNewType && (original.cost !== metadata.cost || (original.maxLevel ?? 1) !== metadata.maxLevel)) {
      textReport.changes.push({ appId, type, before: { cost: original.cost, maxLevel: original.maxLevel ?? 1 }, after: metadata });
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
      if (candidate.english[type] && JSON.stringify(candidate.english[type]) !== JSON.stringify(english)) {
        conflicted.add(type);
        textReport.typeConflicts.push({ appId, gameId, type, reason: "Nodes sharing this type now have different text; retype one of them" });
      } else candidate.english[type] = english;
    } catch (error) {
      const entry = { appId, gameId, type, reason: error.message };
      // Deliberate, narrow compatibility exception; never infer time math.
      if (gameId === "712870937" && error.message === "Unsupported numeric config keen::impact::ScaledTimeImpactConfig") {
        textReport.retainedText.push(entry);
      } else textReport.unresolvedText.push(entry);
    }
    if (candidate.types[type] && JSON.stringify(candidate.types[type]) !== JSON.stringify(metadata)) {
      if (!conflicted.has(type)) textReport.typeConflicts.push({ appId, gameId, type, reason: "Nodes sharing this type now have different costs/levels/stats; retype one of them" });
      conflicted.add(type);
    }
    candidate.types[type] ??= metadata;
  }
  const appId = (gameId) => nextMapping.nodes[gameId]?.appId;
  candidate.nodes = sortedObject(candidate.nodes);
  candidate.edges = canonicalEdges(Object.entries(parsed.neighbors).flatMap(([a, list]) => [...list]
    .filter((b) => candidate.nodes[appId(a)] && candidate.nodes[appId(b)]).map((b) => [appId(a), appId(b)])));
  candidate.retired = sortedObject(Object.fromEntries(Object.entries(nextMapping.retired).map(([id, entry]) => [id, { type: entry.type, name: entry.name }])));
  candidate.types = sortedObject(candidate.types, (a, b) => a.localeCompare(b));
  candidate.english = sortedObject(candidate.english, (a, b) => a.localeCompare(b));
  candidate.treeVersion = { contentHash: candidateContentHash(candidate) };
  return { candidate, textReport };
}

// Full preview: plan, build, and list everything that prevents --apply.
export function runImport({ data, mapping, previous, presentation, locale, inputLabels = {}, changes }) {
  const plan = planImport({ data, mapping, previous, presentation, locale, changes });
  const { candidate, textReport } = buildCandidate(data, plan.parsed, plan.nextMapping, previous, presentation, inputLabels);
  const blockers = [...plan.blockers];
  if (textReport.unresolvedText.length) blockers.push("Unresolved text prevents applying this import; see report.json");
  if (textReport.typeConflicts.length) blockers.push("Shared types diverged; add retype decisions (see typeConflicts)");
  for (const error of textReport.nodeErrors) blockers.push(`${error.reason} (app ${error.appId})`);
  const report = { ...plan.report, decisions: changes ?? null, ...textReport, warnings: plan.warnings, blockers };
  return { report, proposal: plan.proposal, candidate, nextMapping: plan.nextMapping, blockers };
}

// Runtime JSON and the English locale written by --apply.
export function applyImport(candidate, locale) {
  const { english, ...runtime } = structuredClone(candidate);
  const nextLocale = structuredClone(locale);
  for (const [type, metadata] of Object.entries(runtime.types)) {
    metadata.importedEnglish = Boolean(english[type]);
    if (english[type]) {
      metadata.name = english[type].name;
      metadata.description = english[type].description;
    }
    // Keep existing translations and their interpolation intact for other locales.
    nextLocale[type] ??= {};
    delete nextLocale[type].game;
    if (english[type]) nextLocale[type].game = english[type];
  }
  const { schemaVersion, provenance, transform, nodes, edges, retired, types, treeVersion } = runtime;
  return { runtime: { schemaVersion, provenance, transform, nodes, edges, retired, types, treeVersion }, locale: nextLocale };
}

export function summarize(report) {
  const lines = [`# Skill data import preview`, ``, `- Game build: ${report.gameBuild} (previous: ${report.previousGameBuild ?? "none"})`,
    `- Nodes: ${report.counts.exportNodes} in export, ${report.counts.kept} kept, ${report.counts.added} added, ${report.counts.removed} removed`, ``];
  const section = (title, items, format) => { if (items?.length) lines.push(`## ${title}`, ``, ...items.map((item) => `- ${format(item)}`), ``); };
  section("Blockers (apply refused)", report.blockers, (item) => item);
  section("Added game nodes", report.added, (item) => `${item.gameId} ${item.name}${item.base ? " (base)" : ""}, neighbors ${item.neighbors.join(", ") || "none"}`);
  section("Removed game nodes", report.removed, (item) => `${item.gameId} app ${item.appId} ${item.type} (${item.name})`);
  section("Possible re-IDs (same name)", report.possibleReIds, (item) => `${item.gameId} ${item.name} may be ${item.previousGameId} (app ${item.appId})`);
  section("Returning retired nodes", report.returning, (item) => `${item.gameId} restores app ${item.appId}`);
  section("Renamed (same game ID)", report.renamed, (item) => `${item.gameId} app ${item.appId} ${item.type}: "${item.before}" -> "${item.after}"`);
  section("Edges added", report.graph.added, (edge) => edge.join(" - "));
  section("Edges removed", report.graph.removed, (edge) => edge.join(" - "));
  section("Base links added", report.graph.baseAdded, (id) => id);
  section("Base links removed", report.graph.baseRemoved, (id) => id);
  section("Cost / max level changes", report.changes, (item) => `${item.appId} ${item.type}: ${JSON.stringify(item.before)} -> ${JSON.stringify({ cost: item.after.cost, maxLevel: item.after.maxLevel })}`);
  section("Shared type conflicts", report.typeConflicts, (item) => `${item.appId} ${item.type}: ${item.reason}`);
  section("Unresolved text", report.unresolvedText, (item) => `${item.appId} ${item.type}: ${item.reason}`);
  section("Retained authored text", report.retainedText, (item) => `${item.appId} ${item.type}: ${item.reason}`);
  section("Warnings", report.warnings, (item) => item);
  return lines.join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const input = process.argv[2];
  if (!input) throw new Error("Usage: node scripts/skill-data.mjs <skill-data.json> [--changes=path] [--apply]");
  const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
  const options = process.argv.slice(3);
  const option = (name) => options.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
  const output = path.join(root, ".local/skill-data");
  const paths = {
    locale: path.join(root, "public/locales/en/nodes.json"),
    mapping: path.join(root, "scripts/skill-data-mapping.json"),
    runtime: path.join(root, "src/constants/gameSkillData.json"),
    changes: option("changes") ?? path.join(output, "changes.json"),
  };
  const data = readJson(input);
  const locale = readJson(paths.locale);
  const presentation = loadAuthoredPresentation();
  const previous = readJson(paths.runtime);
  const inputLabels = readJson(option("inputs") ?? path.join(root, "scripts/skill-data-inputs.json"));
  fs.mkdirSync(output, { recursive: true });

  if (options.includes("--initialize-mapping")) {
    if (fs.existsSync(paths.mapping)) throw new Error("Mapping already exists; refusing to replace checked identities");
    const { mapping, unresolved } = initialMapping(data, previousAppTree(previous, presentation), locale);
    if (unresolved.length) throw new Error(`Unresolved identities: ${JSON.stringify(unresolved)}`);
    fs.writeFileSync(paths.mapping, JSON.stringify(mapping, null, 2) + "\n");
  }
  if (!fs.existsSync(paths.mapping)) throw new Error("Initialize and review the identity mapping first");
  const changes = fs.existsSync(paths.changes) ? readJson(paths.changes) : undefined;
  const result = runImport({ data, mapping: readJson(paths.mapping), previous, presentation, locale, inputLabels, changes });
  fs.writeFileSync(path.join(output, "report.json"), JSON.stringify(result.report, null, 2) + "\n");
  fs.writeFileSync(path.join(output, "candidate.json"), JSON.stringify(result.candidate, null, 2) + "\n");
  fs.writeFileSync(path.join(output, "changes.proposed.json"), JSON.stringify(result.proposal, null, 2) + "\n");
  fs.writeFileSync(path.join(output, "summary.md"), summarize(result.report) + "\n");
  console.log(summarize(result.report));
  console.log(`\nWrote ${output}${changes ? ` (decisions from ${paths.changes})` : ""}`);

  if (options.includes("--apply")) {
    if (result.blockers.length) {
      console.error("\nApply refused; resolve the blockers above.");
      process.exit(1);
    }
    const applied = applyImport(result.candidate, locale);
    fs.writeFileSync(paths.runtime, JSON.stringify(applied.runtime, null, 2) + "\n");
    fs.writeFileSync(paths.locale, JSON.stringify(applied.locale, null, 2) + "\n");
    fs.writeFileSync(paths.mapping, JSON.stringify(result.nextMapping, null, 2) + "\n");
    // Approvals are single-use: keep a record, but never re-apply them.
    if (changes) fs.renameSync(paths.changes, path.join(path.dirname(paths.changes), "changes.applied.json"));
    console.log("Applied: gameSkillData.json, en/nodes.json and skill-data-mapping.json updated.");
  }
}
