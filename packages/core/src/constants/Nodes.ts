import authored, {
  AuthoredPresentation,
  Node,
  NodeTypeMetadata,
  SkillNodesType,
} from "./LegacyNodes";
import imported from "./gameSkillData.json";

export * from "./LegacyNodes";

type Point = { x: number; y: number };

export type ImportedTree = {
  nodes: {
    [id: string]: {
      gameNodeId: string;
      type: string;
      base?: boolean;
      position: Point;
      baseAnchor?: Point;
    };
  };
  // Undirected pairs. Game links are directed, but unlocking works from
  // either side, so every pair becomes adjacency in both directions.
  edges: ReadonlyArray<readonly string[]>;
  types: { [type: string]: Partial<NodeTypeMetadata> };
  retired?: { [id: string]: { type: string; name?: string } };
};

// Node membership, types, positions, base links and edges come from the checked
// import; authored presentation (tiers, colors, assets, fallback text) fills in
// app-owned fields. Only types used by an imported node are part of the tree.
export const buildSkillTree = (
  presentation: AuthoredPresentation,
  tree: ImportedTree,
): SkillNodesType => {
  const problems: string[] = [];
  const nodes: SkillNodesType["nodes"] = {};
  const types: SkillNodesType["types"] = {};
  for (const [id, node] of Object.entries(tree.nodes)) {
    const authoredType = presentation.types[node.type];
    if (!authoredType) problems.push(`node "${id}" uses type "${node.type}" without authored presentation`);
    types[node.type] ??= { ...authoredType, ...tree.types[node.type] } as NodeTypeMetadata;
    nodes[id] = {
      ...presentation.nodes[id],
      id,
      gameNodeId: node.gameNodeId,
      type: node.type,
      ...(node.base ? { base: true } : {}),
      position: { kind: "cartesian", ...node.position },
      ...(node.baseAnchor ? { baseAnchor: node.baseAnchor } : {}),
    } as Node;
  }
  const edges: SkillNodesType["edges"] = Object.fromEntries(Object.keys(nodes).map((id) => [id, []]));
  for (const pair of tree.edges) {
    const [a, b] = pair;
    if (pair.length !== 2 || a === b || !edges[a] || !edges[b]) {
      problems.push(`invalid edge ${JSON.stringify(pair)}`);
      continue;
    }
    if (!edges[a].includes(b)) edges[a].push(b);
    if (!edges[b].includes(a)) edges[b].push(a);
  }
  if (problems.length) {
    throw new Error(`Skill tree has ${problems.length} problem(s):\n  - ${problems.join("\n  - ")}`);
  }
  return { types, nodes, edges };
};

const SkillNodes = buildSkillTree(authored, imported as ImportedTree);

// App IDs removed by a game update. Old builds may still reference them.
export const RETIRED_NODES: NonNullable<ImportedTree["retired"]> = (imported as ImportedTree).retired ?? {};

export const getMaxLevel = (typeId: string): number => SkillNodes.types[typeId]?.maxLevel ?? 1;
export default SkillNodes;
