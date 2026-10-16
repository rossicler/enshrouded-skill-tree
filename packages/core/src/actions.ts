import SkillNodes, { SkillNodesType } from "./constants/Nodes";
import { fitsUnderHardCap } from "./points";
import { SkillSelection, getSelectedNeighbors, getSkillsToRemove } from "./selection";

// What a click does to a skill: "primary" unlocks or levels it up (and wraps
// to a refund at its max level), "secondary" refunds one level.
export type SkillAction = "primary" | "secondary";

export type SkillActionOptions = {
  // Skill points the build may not exceed (the hard cap). Unset: no limit.
  maxPoints?: number;
};

export type SkillActionResult =
  // 0 -> 1: the skill joins the build.
  | { type: "unlock"; nodeId: string; selection: SkillSelection }
  | { type: "level-up"; nodeId: string; selection: SkillSelection }
  | { type: "level-down"; nodeId: string; selection: SkillSelection }
  // The skill leaves the build, with every selected skill that would lose its
  // path to a base node (`removed` lists them all, the skill first).
  | { type: "refund"; nodeId: string; selection: SkillSelection; removed: string[] }
  // Not linked to a selected skill or a base node yet.
  | { type: "out-of-range"; nodeId: string }
  // One more level would go over `maxPoints`.
  | { type: "hard-cap"; nodeId: string }
  // Nothing to do (unknown skill, or refunding a skill that isn't selected).
  | { type: "none"; nodeId: string };

export type SkillChange = Extract<SkillActionResult, { selection: SkillSelection }>;

// A selection without `ids`.
export const removeSkills = (selection: SkillSelection, ids: readonly string[]): SkillSelection => {
  const next = { ...selection };
  ids.forEach((id) => delete next[id]);
  return next;
};

// The planner's click rules as a pure function: the selection is never
// mutated, and the result says what happened so the caller can play a sound,
// ask before a large refund, or show why nothing changed.
export const applySkillAction = (
  selection: SkillSelection,
  nodeId: string,
  action: SkillAction,
  { maxPoints }: SkillActionOptions = {},
  tree: SkillNodesType = SkillNodes
): SkillActionResult => {
  const node = tree.nodes[nodeId];
  if (!node) return { type: "none", nodeId };
  const level = selection[nodeId] ?? 0;
  const max = tree.types[node.type]?.maxLevel ?? 1;
  const overCap = () => maxPoints != null && !fitsUnderHardCap(selection, nodeId, maxPoints, tree);
  const refund = (): SkillActionResult => {
    const removed = getSkillsToRemove(nodeId, Object.keys(selection), tree);
    return { type: "refund", nodeId, removed, selection: removeSkills(selection, removed) };
  };

  if (action === "secondary") {
    if (level === 0) return { type: "none", nodeId };
    if (level > 1) return { type: "level-down", nodeId, selection: { ...selection, [nodeId]: level - 1 } };
    // Removing the last level can cut other skills off from a base node.
    return refund();
  }

  if (level === 0) {
    // Only the 0 -> 1 step needs a path to a base node.
    if (!node.base && getSelectedNeighbors(nodeId, selection, tree).length === 0) {
      return { type: "out-of-range", nodeId };
    }
    if (overCap()) return { type: "hard-cap", nodeId };
    return { type: "unlock", nodeId, selection: { ...selection, [nodeId]: 1 } };
  }
  if (level < max) {
    if (overCap()) return { type: "hard-cap", nodeId };
    return { type: "level-up", nodeId, selection: { ...selection, [nodeId]: level + 1 } };
  }
  // At the max level a click wraps around to a full refund.
  return refund();
};
