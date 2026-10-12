export type NodePosition =
  | { kind: "polar"; angle: number; distance: number }
  | { kind: "cartesian"; x: number; y: number };

export type PositionedNode = {
  position?: NodePosition;
  /** Compatibility with authored seeds predating NodePosition. */
  angle?: number;
  distance?: number;
  /** Explicit center-circle endpoint, in normalized app layout units. */
  baseAnchor?: { x: number; y: number };
};

export function resolveNodePosition(node: PositionedNode) {
  const position = node.position ?? (node.angle !== undefined
    ? { kind: "polar" as const, angle: node.angle, distance: node.distance ?? 0 }
    : undefined);
  if (!position) throw new Error("Node has no position");
  if (position.kind === "cartesian") {
    if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) {
      throw new Error("Node coordinates must be finite");
    }
    return { x: position.x, y: position.y };
  }
  if (!Number.isFinite(position.angle) || !Number.isFinite(position.distance)) {
    throw new Error("Node angle and distance must be finite");
  }
  const radians = position.angle * Math.PI / 180;
  const radius = 250 + position.distance;
  // The former rotated 2px wrapper placed the icon center 2px below
  // its origin. Preserve that offset for existing polar seeds.
  return { x: -Math.sin(radians) * (radius + 2), y: Math.cos(radians) * (radius + 2) };
}

export function resolveBaseAnchor(node: PositionedNode) {
  if (node.baseAnchor) {
    return resolveNodePosition({ position: { kind: "cartesian", ...node.baseAnchor } });
  }
  const position = resolveNodePosition(node);
  const radius = Math.hypot(position.x, position.y);
  if (radius === 0) throw new Error("A centered base node requires an explicit baseAnchor");
  return { x: position.x / radius * 198, y: position.y / radius * 198 };
}
