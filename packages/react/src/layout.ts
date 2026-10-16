import {
  LinesAngles,
  SkillNodes,
  TREE_LABELS,
  getBaseLinesToDraw,
  getLinesToDraw,
  resolveBaseAnchor,
  resolveNodePosition,
  type Node,
  type SkillNodesType,
  type TreeLabel,
} from "@enshrouded/core";

// Everything the renderer draws, in tree units (the coordinates in the tree
// data: origin at the tree center, +x right, +y down). Computed once from the
// data, never measured from the DOM.

export type Tier = "small" | "medium" | "large";

// Node frame diameters in tree units.
export const NODE_SIZE: Record<Tier, number> = { small: 20, medium: 25, large: 45 };
// Radius of the core circle and of the dots where branches leave it.
export const CORE_RADIUS = 200;
export const CORE_DOT_RADIUS = 198;
// Class label art is drawn at 30% of its size, past 250 + its distance.
const LABEL_SCALE = 0.3;
const LABEL_START = 250;

// Tree units per content pixel at zoom scale 1 of the pan/zoom layer. The
// layer's default scale of 2 shows the tree at 0.5 screen px per tree unit.
export const TREE_TO_PX = 0.25;
// Room to pan past the tree's edge (labels included), in content pixels:
// 160 screen px at the default zoom, 400 px at the max zoom.
export const PAN_MARGIN = 80;

export type NodeLayout = {
  id: string;
  node: Node;
  x: number;
  y: number;
  tier: Tier;
  size: number;
  maxLevel: number;
};

export type LinkLayout = {
  key: string;
  from: string;
  // A node ID, or "base-<id>" for a base node's link to the core circle.
  to: string;
  kind: "edge" | "base";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type LabelLayout = TreeLabel & { x: number; y: number; w: number; h: number };

export type TreeLayout = {
  nodes: Record<string, NodeLayout>;
  nodeIds: string[];
  links: LinkLayout[];
  labels: LabelLayout[];
  coreDots: { angle: number; x: number; y: number }[];
  // Half the size of the pan/zoom content box, in content pixels.
  halfExtent: { x: number; y: number };
};

const polar = (angle: number, radius: number) => {
  const r = (angle * Math.PI) / 180;
  return { x: -Math.sin(r) * radius, y: Math.cos(r) * radius };
};

// A label box is rotated out to its radius, then turned upright about its own
// center, so it ends up upright around the rotated center.
const labelLayout = (label: TreeLabel): LabelLayout => {
  const w = label.width * LABEL_SCALE;
  const h = label.height * LABEL_SCALE;
  const a = (label.angle * Math.PI) / 180;
  const cx0 = w / 2;
  const cy0 = LABEL_START + label.distance + h / 2;
  const cx = cx0 * Math.cos(a) - cy0 * Math.sin(a);
  const cy = cx0 * Math.sin(a) + cy0 * Math.cos(a);
  return { ...label, x: cx - w / 2, y: cy - h / 2, w, h };
};

export const buildTreeLayout = (tree: SkillNodesType = SkillNodes): TreeLayout => {
  const nodes: Record<string, NodeLayout> = {};
  for (const node of Object.values(tree.nodes)) {
    const { x, y } = resolveNodePosition(node);
    const tier = node.tier ?? "small";
    nodes[node.id] = { id: node.id, node, x, y, tier, size: NODE_SIZE[tier], maxLevel: tree.types[node.type]?.maxLevel ?? 1 };
  }
  const links: LinkLayout[] = [
    ...getLinesToDraw(tree).map(([from, to]) => ({
      key: `${from}-${to}`,
      from,
      to,
      kind: "edge" as const,
      x1: nodes[from].x,
      y1: nodes[from].y,
      x2: nodes[to].x,
      y2: nodes[to].y,
    })),
    ...getBaseLinesToDraw(tree).map(([from, to]) => {
      const anchor = resolveBaseAnchor(tree.nodes[from]);
      return { key: `${from}-${to}`, from, to, kind: "base" as const, x1: nodes[from].x, y1: nodes[from].y, x2: anchor.x, y2: anchor.y };
    }),
  ];
  const labels = TREE_LABELS.map(labelLayout);

  let x = 0;
  let y = 0;
  for (const n of Object.values(nodes)) {
    x = Math.max(x, Math.abs(n.x) + NODE_SIZE.large / 2);
    y = Math.max(y, Math.abs(n.y) + NODE_SIZE.large / 2);
  }
  for (const l of labels) {
    x = Math.max(x, Math.abs(l.x), Math.abs(l.x + l.w));
    y = Math.max(y, Math.abs(l.y), Math.abs(l.y + l.h));
  }
  return {
    nodes,
    nodeIds: Object.keys(nodes),
    links,
    labels,
    coreDots: LinesAngles.map((angle) => ({ angle, ...polar(angle, CORE_DOT_RADIUS) })),
    // Whole pixels, so the tree center (the box center) lands on a pixel.
    halfExtent: { x: Math.ceil(x * TREE_TO_PX) + PAN_MARGIN, y: Math.ceil(y * TREE_TO_PX) + PAN_MARGIN },
  };
};

let defaultLayout: TreeLayout | undefined;
export const getTreeLayout = () => (defaultLayout ??= buildTreeLayout());
