import { describe, expect, it } from "vitest";
import { buildSkillTree } from "../constants/Nodes";
import { applySkillAction, removeSkills } from "../actions";

// base(1) - 2 - 3, plus 4 attached to 3. A has 3 levels and costs 1, B costs 2.
const tree = buildSkillTree(
  { types: { A: { color: "blue" }, B: { color: "red" } }, nodes: {} },
  {
    nodes: {
      "1": { gameNodeId: "g1", type: "A", base: true, position: { x: 0, y: 200 } },
      "2": { gameNodeId: "g2", type: "B", position: { x: 0, y: 260 } },
      "3": { gameNodeId: "g3", type: "B", position: { x: 0, y: 320 } },
      "4": { gameNodeId: "g4", type: "A", position: { x: 40, y: 320 } },
    },
    edges: [["1", "2"], ["2", "3"], ["4", "3"]],
    types: { A: { cost: 1, maxLevel: 3 }, B: { cost: 2 } },
  }
);
const act = (selection: Record<string, number>, id: string, action: "primary" | "secondary" = "primary", maxPoints?: number) =>
  applySkillAction(selection, id, action, { maxPoints }, tree);

describe("applySkillAction", () => {
  it("unlocks a base node, then levels it up to its max", () => {
    expect(act({}, "1")).toEqual({ type: "unlock", nodeId: "1", selection: { "1": 1 } });
    expect(act({ "1": 1 }, "1")).toEqual({ type: "level-up", nodeId: "1", selection: { "1": 2 } });
    expect(act({ "1": 2 }, "1")).toEqual({ type: "level-up", nodeId: "1", selection: { "1": 3 } });
  });

  it("refuses a skill with no selected neighbor", () => {
    expect(act({}, "2")).toEqual({ type: "out-of-range", nodeId: "2" });
    expect(act({ "1": 1 }, "2")).toMatchObject({ type: "unlock", selection: { "1": 1, "2": 1 } });
  });

  it("wraps a max-level skill to a refund of everything that depends on it", () => {
    const selection = { "1": 3, "2": 1, "3": 1, "4": 1 };
    const result = act(selection, "1");
    expect(result).toMatchObject({ type: "refund", nodeId: "1", selection: {} });
    expect(result.type === "refund" && [...result.removed].sort()).toEqual(["1", "2", "3", "4"]);
    // The input is left alone.
    expect(selection).toEqual({ "1": 3, "2": 1, "3": 1, "4": 1 });
  });

  it("refunds one level on secondary, then the skill", () => {
    expect(act({ "1": 2 }, "1", "secondary")).toEqual({ type: "level-down", nodeId: "1", selection: { "1": 1 } });
    expect(act({ "1": 1, "2": 1 }, "1", "secondary")).toMatchObject({ type: "refund", removed: ["1", "2"], selection: {} });
    expect(act({ "1": 1, "2": 1, "3": 1 }, "3", "secondary")).toMatchObject({ type: "refund", removed: ["3"], selection: { "1": 1, "2": 1 } });
    expect(act({}, "1", "secondary")).toEqual({ type: "none", nodeId: "1" });
  });

  it("stops at the hard cap", () => {
    expect(act({}, "1", "primary", 0)).toEqual({ type: "hard-cap", nodeId: "1" });
    expect(act({ "1": 1 }, "2", "primary", 2)).toEqual({ type: "hard-cap", nodeId: "2" });
    expect(act({ "1": 1 }, "2", "primary", 3)).toMatchObject({ type: "unlock" });
    expect(act({ "1": 1 }, "1", "primary", 1)).toEqual({ type: "hard-cap", nodeId: "1" });
    // Refunds always work.
    expect(act({ "1": 1 }, "1", "secondary", 0)).toMatchObject({ type: "refund" });
  });

  it("ignores unknown skills", () => {
    expect(act({}, "99")).toEqual({ type: "none", nodeId: "99" });
  });
});

describe("removeSkills", () => {
  it("returns a copy without the given skills", () => {
    const selection = { "1": 1, "2": 2 };
    expect(removeSkills(selection, ["2"])).toEqual({ "1": 1 });
    expect(selection).toEqual({ "1": 1, "2": 2 });
  });
});
