import { memo } from "react";

import { getTreeLabelName } from "@enshrouded/core";

import { assetUrl } from "../art";
import { CORE_RADIUS, getTreeLayout } from "../layout";
import { defId } from "./Defs";

const CORE_COLOR = "rgb(192 132 252)";

// The core circle and the dots where branches leave it.
export const CoreCircle = memo(function CoreCircle({ scope }: { scope: string }) {
  const { coreDots } = getTreeLayout();
  return (
    <g pointerEvents="none">
      {/* A 1-unit border on the inside of a 400-unit circle. */}
      <circle r={CORE_RADIUS - 0.5} fill="none" stroke={CORE_COLOR} strokeOpacity={0.3} strokeWidth={1} />
      <g filter={`url(#${defId(scope, "dot-glow")})`}>
        {coreDots.map((dot) => (
          <circle key={dot.angle} cx={dot.x} cy={dot.y} r={4} fill={CORE_COLOR} />
        ))}
      </g>
    </g>
  );
});

// Class names around the tree (label art).
export const TreeLabels = memo(function TreeLabels({ assetBaseUrl, locale }: { assetBaseUrl: string; locale: string }) {
  const { labels } = getTreeLayout();
  return (
    <g pointerEvents="none">
      {labels.map((label) => (
        <image
          key={label.nameKey}
          href={assetUrl(assetBaseUrl, `labels/${label.asset}.png`)}
          x={label.x}
          y={label.y}
          width={label.w}
          height={label.h}
          preserveAspectRatio="none"
          role="img"
          aria-label={getTreeLabelName(label.nameKey, locale)}
        />
      ))}
    </g>
  );
});
