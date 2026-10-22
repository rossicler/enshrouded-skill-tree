import { Tooltip } from "react-tooltip";

import { cssString } from "../nodeDom";
import { SkillTooltipCard, type SkillTooltipCardProps } from "../SkillTooltip";
import type { TreeTooltipApi } from "./useTreeTooltip";

export type TreeTooltipProps = {
  tooltip: Pick<TreeTooltipApi, "tip" | "isOpen" | "close" | "tooltipRef" | "wrapperHandlers">;
  // The tree's `data-skill-tree-scope`, so only its own nodes are anchors.
  scope: string;
  positionStrategy?: "absolute" | "fixed";
  // The card's props for a node.
  cardFor: (nodeId: string) => Omit<SkillTooltipCardProps, "nodeId" | "onClose">;
};

// The tree's tooltip: react-tooltip draws it, useTreeTooltip decides when.
export const TreeTooltip = ({ tooltip, scope, positionStrategy, cardFor }: TreeTooltipProps) => {
  const { tip, isOpen, close, tooltipRef, wrapperHandlers } = tooltip;
  return (
    <Tooltip
      // Anchored on the tooltip's node. Before the first one opens, any of
      // this tree's nodes: with no anchor at all, the library re-renders
      // after every change of the build.
      anchorSelect={`[data-skill-tree-scope="${scope}"] [data-node-id${tip ? `="${cssString(tip.nodeId)}"` : ""}]`}
      imperativeModeOnly
      isOpen={isOpen}
      // The library closes it itself only when its anchor leaves the page.
      setIsOpen={(open) => {
        if (!open) close();
      }}
      className="!p-0 !bg-transparent !border-0 !rounded-none"
      style={{ zIndex: 9999 }}
      positionStrategy={positionStrategy}
      noArrow
      clickable
      render={({ activeAnchor }) => {
        const nodeId = activeAnchor?.getAttribute("data-node-id");
        if (!nodeId) return null;
        return (
          <div ref={tooltipRef} {...wrapperHandlers}>
            <SkillTooltipCard nodeId={nodeId} {...cardFor(nodeId)} onClose={close} />
          </div>
        );
      }}
    />
  );
};
