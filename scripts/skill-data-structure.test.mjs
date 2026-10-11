import { describe, expect, it } from "vitest";
import { applyImport, loadAuthoredPresentation, runImport, summarize } from "./skill-data.mjs";
import { addNode, neighborsOf, removeNode, renameNode, syntheticExport } from "./fixtures/synthetic-export.mjs";
import { buildSkillTree } from "../src/constants/Nodes";
import { getSelectableSkills } from "../src/utils/utils";
import runtime from "../src/constants/gameSkillData.json";
import locale from "../public/locales/en/nodes.json";
import frLocale from "../public/locales/fr/nodes.json";
import mapping from "./skill-data-mapping.json";

const presentation = loadAuthoredPresentation();
const fresh = () => syntheticExport({ runtime, mapping, locale, frLocale });
const appLocales = { en: locale, fr: frLocale };
const gameIdOf = (appId) => Object.entries(mapping.nodes).find(([, entry]) => entry.appId === appId)[0];
// Locales with a translation for every authored type (new fixture types get one
// alongside their presentation, as a maintainer would add before applying).
const translated = (pres) => {
  const fill = (nodes) => ({ ...Object.fromEntries(Object.keys(pres.types)
    .map((type) => [type, { description: [`${type} translation.`] }])), ...nodes });
  return { en: fill(locale), fr: fill(frLocale) };
};
const run = (data, changes, options = {}) => runImport({
  data, changes,
  mapping: options.mapping ?? mapping,
  previous: options.previous ?? runtime,
  presentation: options.presentation ?? presentation,
  locales: options.locales ?? translated(options.presentation ?? presentation),
});
const approve = (result) => structuredClone(result.proposal);
const withType = (type) => ({ ...presentation, types: { ...presentation.types, [type]: { color: "blue" } } });
const treeOf = (result, pres = presentation) => buildSkillTree(pres, applyImport(result.candidate, appLocales).runtime);

// Every edge must be traversable from both endpoints, whatever the direction
// of the game's link record.
const expectBidirectional = (tree) => {
  for (const [a, list] of Object.entries(tree.edges)) {
    for (const b of list) {
      expect(tree.edges[b]).toContain(a);
      expect(getSelectableSkills({ [a]: 1 }, tree)).toContain(b);
      expect(getSelectableSkills({ [b]: 1 }, tree)).toContain(a);
    }
  }
};

describe("structural import: unchanged tree", () => {
  const result = run(fresh());

  it("reproduces nodes, edges, bases and positions without blockers", () => {
    expect(result.blockers).toEqual([]);
    expect(result.report.counts).toMatchObject({ added: 0, removed: 0 });
    expect(Object.values(result.report.graph).flat()).toEqual([]);
    expect(result.nextMapping).toEqual(mapping);
    expect(result.candidate.edges).toEqual(runtime.edges);
    expect(Object.keys(result.candidate.nodes)).toEqual(Object.keys(runtime.nodes));
    for (const [id, node] of Object.entries(runtime.nodes)) {
      const next = result.candidate.nodes[id];
      expect(next.type).toBe(node.type);
      expect(Boolean(next.base)).toBe(Boolean(node.base));
      expect(next.position.x).toBeCloseTo(node.position.x, 6);
      expect(next.position.y).toBeCloseTo(node.position.y, 6);
    }
  });

  it("turns one-way game links into adjacency usable from either side", () => {
    expectBidirectional(treeOf(result));
  });
});

describe("structural import: additions", () => {
  const newGameId = "4000000001";
  const neighbor = gameIdOf("222");
  const data = addNode(fresh(), { gameId: newGameId, name: "Frost Nova", near: neighbor, neighbors: [neighbor] });

  it("proposes a new app ID and type, and requires a reviewed changes file", () => {
    const preview = run(data);
    expect(preview.report.added).toEqual([{ gameId: newGameId, name: "Frost Nova", base: false, neighbors: ["222"] }]);
    expect(preview.proposal.add).toEqual({ [newGameId]: { appId: "223", type: "FROST_NOVA" } });
    expect(preview.proposal.graph.added).toEqual([["222", "223"]]);
    expect(preview.blockers.some((blocker) => blocker.includes("reviewed changes file"))).toBe(true);
    expect(summarize(preview.report)).toContain("Frost Nova");
  });

  it("requires authored presentation for a new type before applying", () => {
    const preview = run(data);
    const pending = run(data, approve(preview));
    expect(pending.blockers).toEqual([expect.stringContaining("Type FROST_NOVA needs authored presentation")]);

    const pres = withType("FROST_NOVA");
    const applied = run(data, approve(preview), { presentation: pres });
    expect(applied.blockers).toEqual([]);
    expect(applied.report.warnings).toContain('Node 223 (Frost Nova) has no authored tier; it renders as "small"');
    expect(applied.nextMapping.nodes[newGameId]).toEqual({ appId: "223", type: "FROST_NOVA" });
    const output = applyImport(applied.candidate, appLocales);
    expect(output.runtime.nodes["223"]).toMatchObject({ gameNodeId: newGameId, type: "FROST_NOVA" });
    expect(output.runtime.types.FROST_NOVA.gameTextLocales).toEqual(["en", "fr"]);
    expect(output.locales.en.FROST_NOVA.game.name).toBe("Frost Nova");
    expect(output.locales.fr.FROST_NOVA.game.description).toEqual(["Frost Nova fixture text."]);

    const tree = buildSkillTree(pres, output.runtime);
    expect(tree.edges["222"]).toContain("223");
    expect(tree.edges["223"]).toContain("222");
    expect(getSelectableSkills({ "222": 1 }, tree)).toContain("223");
    expect(getSelectableSkills({ "223": 1 }, tree)).toContain("222");
    expectBidirectional(tree);
  });

  it("requires a translation only in locales without game text", () => {
    const pres = withType("FROST_NOVA");
    const locales = translated(pres);
    delete locales.fr.FROST_NOVA;
    locales.de = structuredClone(locales.fr);
    const result = run(data, approve(run(data)), { presentation: pres, locales });
    expect(result.blockers).toEqual(["Type FROST_NOVA needs a translation (description) in public/locales/de/nodes.json"]);
  });

  it("blocks apply while a locale's game text is unresolved", () => {
    const missing = structuredClone(data);
    delete missing.interpreted.nodes.find((node) => node.gameNodeId === newGameId).translations.Fr_Fr;
    const result = run(missing, approve(run(missing)), { presentation: withType("FROST_NOVA") });
    expect(result.report.unresolvedText).toEqual([expect.objectContaining({ appId: "223", locale: "fr", reason: "No Fr_Fr text in the export" })]);
    expect(result.blockers).toContain("Unresolved text prevents applying this import; see report.json");
  });

  it("reuses an existing type when the name matches", () => {
    const strength = addNode(fresh(), { gameId: newGameId, name: "Strength", frenchName: frLocale.ATTR_STR.game?.name ?? frLocale.ATTR_STR.name,
      near: neighbor, neighbors: [neighbor] });
    const preview = run(strength);
    expect(preview.proposal.add[newGameId].type).toBe("ATTR_STR");
    expect(run(strength, approve(preview)).blockers).toEqual([]);
  });

  it("refuses undecided additions and approvals for another build", () => {
    const preview = run(data, undefined, { presentation: withType("FROST_NOVA") });
    const undecided = { ...approve(preview), add: {} };
    expect(run(data, undecided).blockers).toContain(`Undecided new game node ${newGameId} (Frost Nova)`);
    const stale = { ...approve(preview), gameBuild: "1|old" };
    expect(run(data, stale, { presentation: withType("FROST_NOVA") }).blockers[0]).toMatch(/approved for build 1\|old/);
  });
});

describe("structural import: removals and retired IDs", () => {
  const removedGameId = gameIdOf("222");
  const data = removeNode(fresh(), removedGameId);
  const preview = run(data);
  const approved = run(data, approve(preview));

  it("retires the app ID with its name and drops its edges", () => {
    expect(preview.report.removed).toEqual([{ gameId: removedGameId, appId: "222", type: "ATTR_INT", name: locale.ATTR_INT.game.name }]);
    expect(preview.proposal.remove).toEqual([removedGameId]);
    expect(preview.proposal.graph.removed).toEqual([["202", "222"], ["221", "222"]]);
    expect(approved.blockers).toEqual([]);
    expect(approved.nextMapping.nodes[removedGameId]).toBeUndefined();
    expect(approved.nextMapping.retired["222"]).toMatchObject({ gameId: removedGameId, type: "ATTR_INT" });
    expect(approved.candidate.nodes["222"]).toBeUndefined();
    expect(approved.candidate.retired["222"]).toEqual({ type: "ATTR_INT", name: locale.ATTR_INT.game.name });
  });

  const next = { mapping: approved.nextMapping, previous: applyImport(approved.candidate, appLocales).runtime };

  it("never reuses a retired ID for another skill", () => {
    const added = addNode(structuredClone(data), { gameId: "4000000002", name: "Frost Nova", near: gameIdOf("221"), neighbors: [gameIdOf("221")] });
    const later = run(added, undefined, { ...next, presentation: withType("FROST_NOVA") });
    expect(later.proposal.add["4000000002"].appId).toBe("223");
    const reuse = approve(later);
    reuse.add["4000000002"].appId = "222";
    expect(run(added, reuse, { ...next, presentation: withType("FROST_NOVA") }).blockers)
      .toContain("add: app ID 222 is retired; never reuse it for another skill");
  });

  it("restores the retired ID when the same game ID returns", () => {
    const back = run(fresh(), undefined, next);
    expect(back.report.returning).toEqual([{ gameId: removedGameId, appId: "222" }]);
    expect(back.proposal.add[removedGameId]).toEqual({ appId: "222", type: "ATTR_INT" });
    const restored = run(fresh(), approve(back), next);
    expect(restored.blockers).toEqual([]);
    expect(restored.nextMapping).toEqual(mapping);
  });
});

describe("structural import: re-IDs, renames and shared types", () => {
  it("keeps the app ID when a skill only changes game ID", () => {
    const oldGameId = gameIdOf("5"), newGameId = "4000000005";
    const data = fresh();
    const neighbors = neighborsOf(data, oldGameId);
    removeNode(data, oldGameId);
    addNode(data, { gameId: newGameId, name: locale.PICKAXE_SPECIALIZATION.game.name, near: neighbors[0], neighbors,
      maxLevel: runtime.types.PICKAXE_SPECIALIZATION.maxLevel ?? 1, cost: runtime.types.PICKAXE_SPECIALIZATION.cost });
    const preview = run(data);
    expect(preview.proposal.reassign).toEqual({ [newGameId]: oldGameId });
    expect(preview.proposal.remove).toEqual([]);
    expect(Object.values(preview.report.graph).flat()).toEqual([]);
    const approved = run(data, approve(preview));
    expect(approved.blockers).toEqual([]);
    expect(approved.nextMapping.nodes[newGameId]).toEqual(mapping.nodes[oldGameId]);
    expect(approved.nextMapping.retired).toEqual({});
  });

  it("reports renames without blocking and regenerates the English name", () => {
    const result = run(renameNode(fresh(), gameIdOf("4"), "Stonemason"));
    expect(result.blockers).toEqual([]);
    expect(result.report.renamed).toEqual([expect.objectContaining({ appId: "4", type: "MASON", before: "Mason", after: "Stonemason" })]);
    expect(applyImport(result.candidate, appLocales).locales.en.MASON.game.name).toBe("Stonemason");
  });

  it("blocks diverging shared types until one node is retyped", () => {
    const strengthId = Object.keys(runtime.nodes).find((id) => runtime.nodes[id].type === "ATTR_STR");
    const data = renameNode(fresh(), gameIdOf(strengthId), "Brawn");
    const conflict = run(data);
    expect(conflict.report.typeConflicts.map((entry) => entry.type)).toContain("ATTR_STR");
    expect(conflict.blockers.some((blocker) => blocker.includes("Shared types diverged"))).toBe(true);
    const changes = { ...approve(conflict), retype: { [gameIdOf(strengthId)]: "ATTR_BRAWN" } };
    const resolved = run(data, changes, { presentation: withType("ATTR_BRAWN") });
    expect(resolved.blockers).toEqual([]);
    expect(resolved.candidate.nodes[strengthId].type).toBe("ATTR_BRAWN");
  });
});

describe("structural import: graph and base changes", () => {
  it("gates a new edge between existing nodes on exact approval", () => {
    const data = fresh();
    data.raw.trees[0].data.links.push({ sourceNode: { value: gameIdOf("1") }, targetNode: { value: gameIdOf("222") } });
    const preview = run(data);
    expect(preview.report.graph.added).toEqual([["1", "222"]]);
    expect(preview.blockers.some((blocker) => blocker.includes("not approved exactly"))).toBe(true);
    const approved = run(data, approve(preview));
    expect(approved.blockers).toEqual([]);
    const tree = treeOf(approved);
    expect(tree.edges["1"]).toContain("222");
    expect(tree.edges["222"]).toContain("1");
  });

  it("reports a new base link and anchors the node to its root", () => {
    const data = fresh();
    const tree = data.raw.trees[0].data;
    const rootId = String(tree.nodes.find((node) => node.type === "Root").id.value);
    tree.links.push({ sourceNode: { value: rootId }, targetNode: { value: gameIdOf("5") } });
    const preview = run(data);
    expect(preview.report.graph.baseAdded).toEqual(["5"]);
    const approved = run(data, approve(preview));
    expect(approved.blockers).toEqual([]);
    expect(approved.candidate.nodes["5"]).toMatchObject({ base: true, baseAnchor: expect.any(Object) });
  });
});
