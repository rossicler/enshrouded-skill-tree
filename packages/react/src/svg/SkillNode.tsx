import { memo } from "react";

import { assetUrl, getNodeArt, type NodeState } from "../art";
import { GLOW_REACH } from "../glow";
import { getTreeLayout } from "../layout";
import { defId } from "./Defs";

export type SkillNodeProps = {
  id: string;
  state: NodeState;
  level: number;
  searched: boolean;
  // A colored ring around the node, e.g. a stat highlight: one CSS color, or
  // several for a ring split into equal arcs (clockwise from the top).
  marker?: string | readonly string[];
  assetBaseUrl: string;
  // Prefix of this tree's <defs> ids.
  scope: string;
};

// Image of `width` tree units, its height from the image's own aspect ratio,
// centered on the node: a box three times taller than wide with "meet" draws
// any image up to 3:1 at exactly that width.
const CenteredImage = ({ href, width, dim, scope }: { href: string; width: number; dim: boolean; scope: string }) => (
  <image
    href={href}
    x={-width / 2}
    y={-width * 1.5}
    width={width}
    height={width * 3}
    preserveAspectRatio="xMidYMid meet"
    filter={dim ? `url(#${defId(scope, "dim")})` : undefined}
  />
);

// One skill. Its props are primitives, so a change to the build re-renders
// only the nodes whose state, level or search match changed.
export const SkillNodeBase = ({ id, state, level, searched, marker, assetBaseUrl, scope }: SkillNodeProps) => {
  const markerColors = typeof marker === "string" ? [marker] : (marker ?? []);
  const { node, x, y, tier, size, maxLevel } = getTreeLayout().nodes[id];
  const art = getNodeArt(node, state);
  const iconSize = size - (state === "locked" ? 20 : 15) - (art.iconOffset ?? 0);

  return (
    <g transform={`translate(${x} ${y})`} pointerEvents="none">
      {searched && (
        <circle
          r={size / 2 + GLOW_REACH}
          fill={`url(#${defId(scope, `glow-${tier}`)})`}
          className="animate-skill-tree-glow"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
      )}
      <MarkerRing colors={markerColors} size={size} />
      <CenteredImage href={assetUrl(assetBaseUrl, art.frame)} width={size} dim={art.dim} scope={scope} />
      {art.icon && <CenteredImage href={assetUrl(assetBaseUrl, art.icon)} width={iconSize} dim={art.dim} scope={scope} />}
      {maxLevel > 1 && (
        <text
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={14}
          fontWeight="bold"
          fill={level > 0 ? "#e8d5a3" : "#c0b89a"}
          fillOpacity={level > 0 ? 1 : 0.7}
          filter={`url(#${defId(scope, "text-shadow")})`}
        >
          {level}/{maxLevel}
        </text>
      )}
      {/* The hit area, last so it is on top. Tests and tooltips find nodes by data-node-id. */}
      <circle
        r={size / 2}
        fill="transparent"
        pointerEvents="all"
        // A host dialog can hand focus back to the node it was opened from
        // (the refund confirmation does). Nodes aren't keyboard controls, so
        // Chrome's default focus outline would only draw a stray box.
        style={{ outline: "none" }}
        data-node-id={id}
        data-node-type={node.type}
        data-state={state}
        data-selected={state === "selected" ? "true" : "false"}
        data-level={level}
        data-max-level={maxLevel}
        data-searched={searched ? "true" : "false"}
        data-marked={markerColors.length > 0 ? "true" : "false"}
        data-marker-count={markerColors.length || undefined}
      />
    </g>
  );
};

export const SkillNode = memo(SkillNodeBase);

// Marker ring geometry, in the node's units: a soft disc behind the frame and
// a solid ring just outside it.
const GLOW_GAP = 14;
const RING_GAP = 7;
const RING_WIDTH = 6;

const point = (radius: number, degrees: number) => {
  const radians = (degrees * Math.PI) / 180;
  return `${(radius * Math.cos(radians)).toFixed(2)} ${(radius * Math.sin(radians)).toFixed(2)}`;
};

// Angles in degrees, 0 = right, clockwise (SVG's y axis points down).
const arcTo = (radius: number, from: number, to: number) =>
  `A ${radius} ${radius} 0 ${to - from > 180 ? 1 : 0} 1 ${point(radius, to)}`;

// The circle's outline from `from` to `to`.
const arc = (radius: number, from: number, to: number) => `M ${point(radius, from)} ${arcTo(radius, from, to)}`;

// The pie slice from the center between `from` and `to`.
const wedge = (radius: number, from: number, to: number) =>
  `M 0 0 L ${point(radius, from)} ${arcTo(radius, from, to)} Z`;

// One color: a full ring. Several: the ring and the glow split into equal
// arcs, the first starting at the top.
const MarkerRing = ({ colors, size }: { colors: readonly string[]; size: number }) => {
  if (colors.length === 0) return null;
  const glow = size / 2 + GLOW_GAP;
  const ring = size / 2 + RING_GAP;
  if (colors.length === 1) {
    return (
      <>
        <circle r={glow} fill={colors[0]} fillOpacity={0.25} />
        <circle r={ring} fill="none" stroke={colors[0]} strokeWidth={RING_WIDTH} strokeOpacity={0.95} />
      </>
    );
  }
  const step = 360 / colors.length;
  return (
    <>
      {colors.map((color, i) => {
        const from = -90 + i * step;
        const to = from + step;
        return (
          <g key={i} data-marker-arc={color}>
            <path d={wedge(glow, from, to)} fill={color} fillOpacity={0.25} />
            <path d={arc(ring, from, to)} fill="none" stroke={color} strokeWidth={RING_WIDTH} strokeOpacity={0.95} />
          </g>
        );
      })}
    </>
  );
};
