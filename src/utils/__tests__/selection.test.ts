import { describe, expect, it } from "vitest";
import SkillNodes, { buildSkillTree } from "../../constants/Nodes";
import { getSelectableSkills, getSkillsToRemove, sanitizeSelection } from "../utils";

// base(1) - 2 - 3, plus 4 attached to 3. Edges listed in one direction only.
const tree = buildSkillTree(
  {
    types: { A: { color: "blue" }, B: { color: "red" } },
    nodes: { "1": { tier: "large" } },
  },
  {
    nodes: {
      "1": { gameNodeId: "g1", type: "A", base: true, position: { x: 0, y: 200 }, baseAnchor: { x: 0, y: 198 } },
      "2": { gameNodeId: "g2", type: "A", position: { x: 0, y: 260 } },
      "3": { gameNodeId: "g3", type: "B", position: { x: 0, y: 320 } },
      "4": { gameNodeId: "g4", type: "A", position: { x: 40, y: 320 } },
    },
    edges: [["1", "2"], ["2", "3"], ["4", "3"]],
    types: { A: { cost: 1, maxLevel: 3 }, B: { cost: 2 } },
  }
);

describe("generated edges", () => {
  it("are adjacent in both directions in the committed tree", () => {
    for (const [a, list] of Object.entries(SkillNodes.edges)) {
      for (const b of list) expect(SkillNodes.edges[b]).toContain(a);
    }
  });

  it("unlock a skill from either selected neighbor", () => {
    for (const [a, list] of Object.entries(SkillNodes.edges)) {
      for (const b of list) {
        expect(getSelectableSkills({ [a]: 1 }, SkillNodes)).toContain(b);
        expect(getSelectableSkills({ [b]: 1 }, SkillNodes)).toContain(a);
      }
    }
  });

  it("refund through either direction of a fixture edge", () => {
    expect(tree.edges["3"].sort()).toEqual(["2", "4"]);
    expect(getSelectableSkills({ "1": 1, "2": 1, "4": 1 }, tree)).toContain("3");
    expect(getSkillsToRemove("2", ["1", "2", "3", "4"], tree).sort()).toEqual(["2", "3", "4"]);
  });

  it("reject edges to unknown nodes and types without presentation", () => {
    expect(() => buildSkillTree({ types: { A: { color: "blue" } }, nodes: {} }, {
      nodes: { "1": { gameNodeId: "g1", type: "A", position: { x: 0, y: 0 } } },
      edges: [["1", "9"]],
      types: {},
    })).toThrow(/invalid edge/);
    expect(() => buildSkillTree({ types: {}, nodes: {} }, {
      nodes: { "1": { gameNodeId: "g1", type: "NEW", position: { x: 0, y: 0 } } },
      edges: [],
      types: {},
    })).toThrow(/without authored presentation/);
  });
});

describe("sanitizeSelection", () => {
  it("keeps a valid selection unchanged", () => {
    expect(sanitizeSelection({ "1": 3, "2": 1, "3": 1 }, tree)).toEqual({
      selection: { "1": 3, "2": 1, "3": 1 }, removed: [], disconnected: [], clamped: [],
    });
  });

  it("drops retired IDs and skills they disconnected", () => {
    // "2" was removed by an update: 3 and 4 lose their path to the base.
    const withoutTwo = buildSkillTree(
      { types: { A: { color: "blue" }, B: { color: "red" } }, nodes: {} },
      {
        nodes: {
          "1": { gameNodeId: "g1", type: "A", base: true, position: { x: 0, y: 200 }, baseAnchor: { x: 0, y: 198 } },
          "3": { gameNodeId: "g3", type: "B", position: { x: 0, y: 320 } },
          "4": { gameNodeId: "g4", type: "A", position: { x: 40, y: 320 } },
        },
        edges: [["4", "3"]],
        types: { A: { cost: 1, maxLevel: 3 }, B: { cost: 2 } },
      }
    );
    const result = sanitizeSelection({ "1": 1, "2": 1, "3": 1, "4": 2 }, withoutTwo);
    expect(result.selection).toEqual({ "1": 1 });
    expect(result.removed).toEqual(["2"]);
    expect(result.disconnected.sort()).toEqual(["3", "4"]);
  });

  it("clamps levels above a lowered max level", () => {
    const result = sanitizeSelection({ "1": 5, "2": 1, "3": 4 }, tree);
    expect(result.selection).toEqual({ "1": 3, "2": 1, "3": 1 });
    expect(result.clamped).toEqual(["1", "3"]);
  });
});
