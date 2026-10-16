import SkillNodes, { SkillNodesType } from "./constants/Nodes";

// Selected skill ID -> purchased level (1..maxLevel).
export type SkillSelection = { [id: string]: number };

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

// The refunded skill plus every selected skill that would lose its path to a
// base node without it.
export const getSkillsToRemove = (
  removed: string,
  skillsSelected: string[],
  tree: SkillNodesType = SkillNodes
) => {
  const edges = tree.edges[removed] ?? [];

  const connectedSelectedIds = edges.filter(
    (id) => skillsSelected.includes(id) && id !== removed
  );

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
  selectedSkills: SkillSelection,
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

// Selected skills linked to `id`. An unlocked skill connects to each of them.
export const getSelectedNeighbors = (
  id: string,
  selectedSkills: SkillSelection,
  tree: SkillNodesType = SkillNodes
): string[] => Object.keys(selectedSkills).filter((selected) => tree.edges[selected]?.includes(id));

export type SelectionCleanup = {
  selection: SkillSelection;
  // Not in the current tree (e.g. retired by a game update).
  removed: string[];
  // No longer connected to a base node through selected skills.
  disconnected: string[];
  // Level lowered to the current max level.
  clamped: string[];
};

export const hasSelectionChanges = (cleanup: SelectionCleanup): boolean =>
  cleanup.removed.length > 0 || cleanup.disconnected.length > 0 || cleanup.clamped.length > 0;

// Fit a saved or shared selection to the current tree.
export const sanitizeSelection = (
  selectedSkills: SkillSelection,
  tree: SkillNodesType = SkillNodes
): SelectionCleanup => {
  const removed: string[] = [];
  const clamped: string[] = [];
  const kept: SkillSelection = {};
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
