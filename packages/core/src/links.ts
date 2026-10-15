import SkillNodes, { SkillNodesType } from "./constants/Nodes";

export type LineToDrawType = [string, string];

// One [from, to] pair per edge of the tree, whichever direction it is stored in.
export const getLinesToDraw = (tree: SkillNodesType = SkillNodes): LineToDrawType[] => {
  const linesSet = new Set<string>();
  Object.entries(tree.edges).forEach(([from, toList]) => {
    toList.forEach((to) => {
      if (linesSet.has(`${to}-${from}`)) return;
      linesSet.add(`${from}-${to}`);
    });
  });
  const linesToDraw: LineToDrawType[] = [];
  linesSet.forEach((val) => {
    const arr = val.split("-");
    if (arr.length === 2) {
      linesToDraw.push([arr[0], arr[1]]);
    }
  });
  return linesToDraw;
};

// One [nodeId, "base-<nodeId>"] pair per base node: its link to the core circle.
export const getBaseLinesToDraw = (tree: SkillNodesType = SkillNodes): LineToDrawType[] => {
  const linesToDraw: LineToDrawType[] = [];
  Object.values(tree.nodes)
    .filter((item) => item.base)
    .forEach((node) => linesToDraw.push([node.id, `base-${node.id}`]));
  return linesToDraw;
};
