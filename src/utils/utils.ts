import { ClassNameValue, twMerge } from "tailwind-merge";

import SkillNodes from "../constants/Nodes";

type LineToDrawType = [string, string];

export const classNames = (...classes: ClassNameValue[]) => {
  return twMerge(classes);
};

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

export const getBaseLinesToDraw = () => {
  const linesToDraw: [string, string][] = [];
  Object.values(SkillNodes.nodes)
    .filter((item) => item.base)
    .forEach((node) => linesToDraw.push([node.id, String(node.angle)]));
  return linesToDraw;
};

export const getSubGraphNodes = (
  root: string,
  toExclude: string[],
  selectedSkills: string[]
) => {
  let stack = [root];
  const visited = new Set<string>();
  while (stack.length > 0) {
    const nodeId = stack.pop();
    const isRoot = nodeId && SkillNodes.nodes[nodeId]?.base;
    if (isRoot) {
      return { shouldRemove: false, nodes: [] };
    }
    if (nodeId && !visited.has(nodeId)) {
      visited.add(nodeId);
      stack = stack.concat(
        SkillNodes.edges[nodeId].filter(
          (id) =>
            selectedSkills.includes(id) &&
            !toExclude.includes(id) &&
            !visited.has(id)
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
  console.log("connectedSelectedIds", connectedSelectedIds);

  let toRemove: string[] = [removed];
  connectedSelectedIds.forEach((skillToCheck) => {
    const res = getSubGraphNodes(skillToCheck, [removed], skillsSelected);
    if (res.shouldRemove) {
      toRemove = toRemove.concat(Array.from(res.nodes));
    }
  });

  return toRemove;
};

export type BuildData = {
  skills: string[];
  skillLevels?: { [id: string]: number };
  playerLevel?: number;
  unlockedBiomes?: string[];
};

export const convertHashToJson = (hash: string): BuildData => {
  const parsed = JSON.parse(atob(hash));
  // Backward compat: old format was a plain string[]
  if (Array.isArray(parsed)) return { skills: parsed };
  return parsed as BuildData;
};

export const convertJsonToHash = (build: BuildData): string => {
  return btoa(JSON.stringify(build));
};

export const buildToSelectedSkills = (
  build: BuildData
): { [id: string]: number } => {
  const out: { [id: string]: number } = {};
  build.skills.forEach((id) => {
    out[id] = 1;
  });
  if (build.skillLevels) {
    Object.entries(build.skillLevels).forEach(([id, lvl]) => {
      if (out[id] != null) out[id] = Math.max(1, Math.floor(lvl));
    });
  }
  return out;
};
