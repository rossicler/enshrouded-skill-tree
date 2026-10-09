import { ClassNameValue, twMerge } from "tailwind-merge";

import SkillNodes, { SkillNodesType } from "../constants/Nodes";

type SelectedSkills = { [id: string]: number };

type LineToDrawType = [string, string];

export const classNames = (...classes: ClassNameValue[]) => {
  return twMerge(classes);
};

export const humanizeKey = (key: string): string =>
  key
    .toLowerCase()
    .split("_")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");

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
    .forEach((node) => linesToDraw.push([node.id, `base-${node.id}`]));
  return linesToDraw;
};

export const getSubGraphNodes = (
  root: string,
  toExclude: string[],
  selectedSkills: string[],
  tree: SkillNodesType = SkillNodes
) => {
  let stack = [root];
  const visited = new Set<string>();
  while (stack.length > 0) {
    const nodeId = stack.pop();
    const isRoot = nodeId && tree.nodes[nodeId]?.base;
    if (isRoot) {
      return { shouldRemove: false, nodes: [] };
    }
    if (nodeId && !visited.has(nodeId)) {
      visited.add(nodeId);
      stack = stack.concat(
        (tree.edges[nodeId] ?? []).filter(
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
  skillsSelected: string[],
  tree: SkillNodesType = SkillNodes
) => {
  const edges = tree.edges[removed] ?? [];

  const connectedSelectedIds = edges.filter(
    (id) => skillsSelected.includes(id) && id !== removed
  );
  console.log("connectedSelectedIds", connectedSelectedIds);

  let toRemove: string[] = [removed];
  connectedSelectedIds.forEach((skillToCheck) => {
    const res = getSubGraphNodes(skillToCheck, [removed], skillsSelected, tree);
    if (res.shouldRemove) {
      toRemove = toRemove.concat(Array.from(res.nodes));
    }
  });

  return toRemove;
};

// Unselected base nodes, plus unselected neighbors of selected nodes. Edges
// are undirected, so a skill unlocks from whichever side is selected first.
export const getSelectableSkills = (
  selectedSkills: SelectedSkills,
  tree: SkillNodesType = SkillNodes
): string[] => {
  const selectable = new Set<string>();
  Object.values(tree.nodes).forEach((node) => {
    if (node.base && selectedSkills[node.id] == null) selectable.add(node.id);
  });
  Object.keys(selectedSkills).forEach((id) => {
    (tree.edges[id] ?? []).forEach((connected) => {
      if (selectedSkills[connected] == null) selectable.add(connected);
    });
  });
  return Array.from(selectable);
};

export type SelectionCleanup = {
  selection: SelectedSkills;
  // Not in the current tree (e.g. retired by a game update).
  removed: string[];
  // No longer connected to a base node through selected skills.
  disconnected: string[];
  // Level lowered to the current max level.
  clamped: string[];
};

// Fit a saved or shared selection to the current tree.
export const sanitizeSelection = (
  selectedSkills: SelectedSkills,
  tree: SkillNodesType = SkillNodes
): SelectionCleanup => {
  const removed: string[] = [];
  const clamped: string[] = [];
  const kept: SelectedSkills = {};
  Object.entries(selectedSkills).forEach(([id, rawLevel]) => {
    const node = tree.nodes[id];
    if (!node) {
      removed.push(id);
      return;
    }
    const max = tree.types[node.type]?.maxLevel ?? 1;
    const level = Number.isFinite(rawLevel) ? Math.max(1, Math.floor(rawLevel)) : 1;
    if (level > max) clamped.push(id);
    kept[id] = Math.min(level, max);
  });
  const reached = new Set(Object.keys(kept).filter((id) => tree.nodes[id].base));
  const stack = Array.from(reached);
  while (stack.length > 0) {
    const id = stack.pop()!;
    tree.edges[id].forEach((next) => {
      if (kept[next] != null && !reached.has(next)) {
        reached.add(next);
        stack.push(next);
      }
    });
  }
  const disconnected = Object.keys(kept).filter((id) => !reached.has(id));
  disconnected.forEach((id) => delete kept[id]);
  return {
    selection: kept,
    removed,
    disconnected,
    clamped: clamped.filter((id) => kept[id] != null),
  };
};

export type BuildData = {
  skills: string[];
  treeContentHash?: string;
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
