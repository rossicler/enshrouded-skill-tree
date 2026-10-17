import { memo } from "react";

import type { LinkLayout } from "../layout";

const DEFAULT_COLOR = "#251f36";
const CONNECTED_COLOR = "#8e6d08";
// One content pixel at zoom scale 1: 2 screen px at the default zoom.
const STROKE_WIDTH = 4;

export type SkillLinkProps = { link: LinkLayout; connected: boolean };

// A link between two nodes, or from a base node to the core circle. The
// layout object never changes, so only `connected` re-renders it.
export const SkillLinkBase = ({ link, connected }: SkillLinkProps) => (
  <line
    x1={link.x1}
    y1={link.y1}
    x2={link.x2}
    y2={link.y2}
    stroke={connected ? CONNECTED_COLOR : DEFAULT_COLOR}
    strokeWidth={STROKE_WIDTH}
    data-link-from={link.from}
    data-link-to={link.to}
    data-link-kind={link.kind}
    data-connected={connected ? "true" : "false"}
  />
);

export const SkillLink = memo(SkillLinkBase);
