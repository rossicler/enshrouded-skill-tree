import SkillNodes from "../constants/Nodes";

type LineToDrawType = [string, string];

export const getLinesToDraw = () => {
  const linesSet = new Set<string>();
  Object.entries(SkillNodes.edges).forEach(([from, toList]) => {
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

// export const isConnectedToRoot = (selectedList: string[], nodeId: string) => {
//   const node = SkillNodes.nodes.find((node) => node.id === nodeId);
//   if (!node || node.base) return true;

//   const edges = SkillNodes.edges[nodeId];
//   const connectedSelectedIds = edges.filter(
//     (id) => selectedList.includes(id) && id
//   );
//   if (connectedSelectedIds.length === 0) return false;

//   let isConnected = false;
//   const newSelectedList = selectedList.filter((id) => id !== nodeId);
//   connectedSelectedIds.forEach((id) => {
//     if (isConnectedToRoot(newSelectedList, id)) {
//       isConnected = true;
//     }
//   });
//   return isConnected;
// };

export const getSubGraphNodes = (
  root: string,
  toExclude: string[],
  selectedSkills: string[]
) => {
  let stack = [root];
  const visited = new Set<string>();
  while (stack.length > 0) {
    const nodeId = stack.pop();
    const isRoot = SkillNodes.nodes.find((node) => node.id === nodeId)?.base;
    if (isRoot) {
      return { shouldRemove: false, nodes: [] };
    }
    if (nodeId && !visited.has(nodeId)) {
      visited.add(nodeId);
      stack = stack.concat(
        SkillNodes.edges[nodeId].filter(
          (id) => selectedSkills.includes(id) && !toExclude.includes(id)
        )
      );
    }
  }

  return { shouldRemove: true, nodes: visited };
};

export const getSkillsToRemove = (
  removed: string,
  skillsSelected: string[]
) => {
  const edges = SkillNodes.edges[removed];

  const connectedSelectedIds = edges.filter(
    (id) => skillsSelected.includes(id) && id !== removed
  );

  let toRemove: string[] = [removed];
  connectedSelectedIds.forEach((skillToCheck) => {
    const res = getSubGraphNodes(skillToCheck, [removed], skillsSelected);
    if (res.shouldRemove) {
      toRemove = toRemove.concat(Array.from(res.nodes));
    }
  });

  return toRemove;
};
