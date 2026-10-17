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
export const SkillNodeBase = ({ id, state, level, searched, assetBaseUrl, scope }: SkillNodeProps) => {
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
      />
    </g>
  );
};

export const SkillNode = memo(SkillNodeBase);
