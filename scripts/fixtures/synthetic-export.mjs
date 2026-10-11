// Builds a schema 1.1.0 export-shaped object from the committed import, so
// structural changes can be tested without game files. Positions are mapped
// back through the stored transform; each skill edge is written as a single
// directed link (alternating direction), like the game's own links. French
// (Fr_Fr) texts mirror the English ones with the French name where known.
const text = (template) => ({ status: "resolved-template", template, arguments: [] });
const texts = (nodeName) => ({ name: text(nodeName), description: text(`${nodeName} fixture text.`), perLevelEffectDescription: { status: "absent" } });
const interpretedNode = (gameNodeId, nodeName, maxLevel, frenchName = nodeName) => ({
  gameNodeId,
  maxPurchasableLevel: maxLevel,
  texts: texts(nodeName),
  translations: { Fr_Fr: texts(frenchName) },
  effects: [],
});
const resolved = (En_Us, Fr_Fr) => ({ status: "resolved", texts: { En_Us, Fr_Fr } });

export function syntheticExport({ runtime, mapping, locale, frLocale = {} }) {
  const { center, scale } = runtime.transform;
  const toGame = ({ x, y }) => ({ x: x / scale + center.x, y: y / scale + center.y });
  const gameIdOf = Object.fromEntries(Object.entries(mapping.nodes).map(([gameId, { appId }]) => [appId, gameId]));
  const name = (nodes, type) => nodes[type]?.game?.name ?? nodes[type]?.name ?? locale[type]?.game?.name ?? type;

  const nodes = [], interpreted = [], links = [];
  const rootIds = new Map();
  for (const [appId, node] of Object.entries(runtime.nodes)) {
    const gameId = gameIdOf[appId], type = runtime.types[node.type];
    nodes.push({ id: { value: gameId }, type: "Skill", costs: type.cost, uiPosition: toGame(node.position), configValues: { simple: [], scaled: [] } });
    interpreted.push(interpretedNode(gameId, name(locale, node.type), type.maxLevel ?? 1, name(frLocale, node.type)));
    if (node.base) {
      const key = `${node.baseAnchor.x},${node.baseAnchor.y}`;
      if (!rootIds.has(key)) {
        const rootId = String(9000000000 + rootIds.size);
        rootIds.set(key, rootId);
        nodes.push({ id: { value: rootId }, type: "Root", costs: 0, uiPosition: toGame(node.baseAnchor), configValues: { simple: [], scaled: [] } });
        interpreted.push(interpretedNode(rootId, "Root", 1));
      }
      links.push({ sourceNode: { value: rootIds.get(key) }, targetNode: { value: gameId } });
    }
  }
  runtime.edges.forEach(([a, b], index) => {
    const [source, target] = index % 2 ? [b, a] : [a, b];
    links.push({ sourceNode: { value: gameIdOf[source] }, targetNode: { value: gameIdOf[target] } });
  });
  return {
    schemaVersion: "1.1.0",
    locale: "En_Us",
    locales: ["En_Us", "Fr_Fr"],
    issues: [],
    localeIssues: [],
    provenance: structuredClone(runtime.provenance),
    raw: {
      trees: [{ data: { nodes, links } }],
      balancing: [{ data: { playerHealthPerAP: 50, playerManaPerAP: 20, playerStaminaPerAP: 10 } }],
      inputActions: [{ id: 18, name: "SpecialAbility" }],
      uiText: {
        gameplayActionLabels: { weaponSkill: resolved("Special Ability", "Capacité spéciale") },
        punctuation: { decimalSeparator: resolved(".", ".") },
        timeUnitsAbbreviations: resolved("d,h,min,s", "d,h,m,s"),
      },
    },
    interpreted: { nodes: interpreted },
  };
}

// Adds a skill node near an existing one, linked one way (new -> neighbor).
export function addNode(data, { gameId, name, frenchName = name, near, neighbors = [], maxLevel = 1, cost = 1 }) {
  const tree = data.raw.trees[0].data;
  const anchor = tree.nodes.find((node) => String(node.id.value) === near);
  tree.nodes.push({ id: { value: gameId }, type: "Skill", costs: cost,
    uiPosition: { x: anchor.uiPosition.x + 40, y: anchor.uiPosition.y + 40 }, configValues: { simple: [], scaled: [] } });
  data.interpreted.nodes.push(interpretedNode(gameId, name, maxLevel, frenchName));
  for (const neighbor of neighbors) tree.links.push({ sourceNode: { value: gameId }, targetNode: { value: neighbor } });
  return data;
}

export function removeNode(data, gameId) {
  const tree = data.raw.trees[0].data;
  tree.nodes = tree.nodes.filter((node) => String(node.id.value) !== gameId);
  tree.links = tree.links.filter((link) => String(link.sourceNode.value) !== gameId && String(link.targetNode.value) !== gameId);
  data.interpreted.nodes = data.interpreted.nodes.filter((node) => node.gameNodeId !== gameId);
  return data;
}

export function renameNode(data, gameId, name) {
  data.interpreted.nodes.find((node) => node.gameNodeId === gameId).texts.name.template = name;
  return data;
}

export function neighborsOf(data, gameId) {
  return data.raw.trees[0].data.links.flatMap((link) => {
    const a = String(link.sourceNode.value), b = String(link.targetNode.value);
    return a === gameId ? [b] : b === gameId ? [a] : [];
  });
}
