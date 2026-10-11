import { describe, expect, it } from "vitest";
import SkillNodes from "../../constants/Nodes";
import { resolveBaseAnchor, resolveNodePosition } from "../nodePosition";
import { getBaseLinesToDraw } from "../utils";

describe("shared node positioning", () => {
  it("preserves legacy polar icon centers", () => {
    // Former authored seed records: inner/outer rings, offsets and negative distances.
    const legacy = [
      { angle: 345, distance: -120 },
      { angle: 15, distance: -180 },
      { angle: 315, distance: 420 },
      { angle: 345 - 30 + 30 / 1.5, distance: 0 },
    ];
    for (const node of legacy) {
      const angle = node.angle * Math.PI / 180;
      const radius = 250 + node.distance + 2;
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
    // Imported anchors are game-root positions; the import scales their mean radius to 198.
    const roots = new Map(Object.values(SkillNodes.nodes).filter((node) => node.base)
      .map((node) => resolveBaseAnchor(node)).map((anchor) => [`${anchor.x},${anchor.y}`, anchor]));
    const radii = Array.from(roots.values()).map((anchor) => Math.hypot(anchor.x, anchor.y));
    expect(radii.reduce((sum, radius) => sum + radius, 0) / radii.length).toBeCloseTo(198);
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
