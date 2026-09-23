import { describe, expect, it } from "vitest";
import SkillNodes from "../../constants/LegacyNodes";
import { resolveBaseAnchor, resolveNodePosition } from "../nodePosition";
import { getBaseLinesToDraw } from "../utils";

describe("shared node positioning", () => {
  it("preserves every authored polar icon center", () => {
    for (const node of Object.values(SkillNodes.nodes)) {
      const angle = node.angle! * Math.PI / 180;
      const radius = 250 + (node.distance ?? 0) + 2;
      const result = resolveNodePosition(node);
      expect(result.x).toBeCloseTo(-Math.sin(angle) * radius, 10);
      expect(result.y).toBeCloseTo(Math.cos(angle) * radius, 10);
    }
  });

  it("accepts angle zero and explicit polar data", () => {
    expect(resolveNodePosition({ angle: 0 })).toEqual({ x: -0, y: 252 });
    expect(resolveNodePosition({ position: { kind: "polar", angle: 90, distance: 10 } }).x).toBeCloseTo(-262);
  });

  it("uses Cartesian coordinates directly, ahead of legacy fields", () => {
    expect(resolveNodePosition({ angle: 90, position: { kind: "cartesian", x: 0, y: -20 } }))
      .toEqual({ x: 0, y: -20 });
  });

  it("gives base links stable IDs independent of angles", () => {
    expect(getBaseLinesToDraw()).toEqual(Object.values(SkillNodes.nodes)
      .filter((node) => node.base).map((node) => [node.id, `base-${node.id}`]));
    for (const node of Object.values(SkillNodes.nodes).filter((node) => node.base)) {
      const anchor = resolveBaseAnchor(node);
      expect(Math.hypot(anchor.x, anchor.y)).toBeCloseTo(198);
    }
  });

  it("supports Cartesian radial and explicit game-root anchors", () => {
    expect(resolveBaseAnchor({ position: { kind: "cartesian", x: -300, y: 0 } }))
      .toEqual({ x: -198, y: 0 });
    expect(resolveBaseAnchor({ baseAnchor: { x: 12, y: 24 } })).toEqual({ x: 12, y: 24 });
  });

  it("rejects missing, non-finite and ambiguous centered positions", () => {
    expect(() => resolveNodePosition({})).toThrow();
    expect(() => resolveNodePosition({ angle: NaN })).toThrow();
    expect(() => resolveNodePosition({ angle: 0, distance: Infinity })).toThrow();
    expect(() => resolveNodePosition({ position: { kind: "cartesian", x: Infinity, y: 0 } })).toThrow();
    expect(() => resolveBaseAnchor({ position: { kind: "cartesian", x: 0, y: 0 } })).toThrow();
  });
});
