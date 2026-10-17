import { memo } from "react";

import { glowStops } from "../glow";
import { NODE_SIZE, type Tier } from "../layout";

// Ids inside one tree's <svg>, prefixed per instance so several trees can
// share a page.
export const defId = (scope: string, name: string) => `${scope}-${name}`;

const TIERS = Object.keys(NODE_SIZE) as Tier[];

const Defs = ({ scope }: { scope: string }) => (
  <defs>
    {/* Half brightness, like CSS brightness(0.5). */}
    <filter id={defId(scope, "dim")} colorInterpolationFilters="sRGB">
      <feComponentTransfer>
        <feFuncR type="linear" slope={0.5} />
        <feFuncG type="linear" slope={0.5} />
        <feFuncB type="linear" slope={0.5} />
      </feComponentTransfer>
    </filter>
    {/* Like CSS drop-shadow(0 0 4px rgba(0,0,0,0.95)) behind level badges. */}
    <filter id={defId(scope, "text-shadow")} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
      <feDropShadow dx={0} dy={0} stdDeviation={2} floodColor="#000" floodOpacity={0.95} />
    </filter>
    {/* Like CSS drop-shadow(0 0 3px rgb(192 132 252)) on the core circle's dots. */}
    <filter id={defId(scope, "dot-glow")} x="-100%" y="-100%" width="300%" height="300%" colorInterpolationFilters="sRGB">
      <feDropShadow dx={0} dy={0} stdDeviation={1.5} floodColor="rgb(192 132 252)" />
    </filter>
    {TIERS.map((tier) => (
      <radialGradient key={tier} id={defId(scope, `glow-${tier}`)}>
        {glowStops(NODE_SIZE[tier] / 2).map((stop, i) => (
          <stop key={i} offset={stop.offset} stopColor={stop.color} stopOpacity={stop.opacity} />
        ))}
      </radialGradient>
    ))}
  </defs>
);

export default memo(Defs);
