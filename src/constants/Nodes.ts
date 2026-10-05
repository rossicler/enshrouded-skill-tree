import authored, { SkillNodesType } from "./LegacyNodes";
import imported from "./gameSkillData.json";

export * from "./LegacyNodes";

// Presentation overrides and adjacency stay authored; source IDs, positions,
// costs and supported basic attributes come from the checked import.
const SkillNodes: SkillNodesType = {
  types: Object.fromEntries(Object.entries(authored.types).map(([key, value]) => [
    key, { ...value, ...(imported.types as Record<string, object>)[key] },
  ])),
  nodes: Object.fromEntries(Object.entries(authored.nodes).map(([id, node]) => [
    id, { ...node, ...imported.nodes[id as keyof typeof imported.nodes],
      position: { ...imported.nodes[id as keyof typeof imported.nodes].position, kind: "cartesian" as const } },
  ])),
  edges: authored.edges,
};

export const getMaxLevel = (typeId: string): number => SkillNodes.types[typeId]?.maxLevel ?? 1;
export default SkillNodes;
