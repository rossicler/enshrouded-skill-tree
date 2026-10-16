import { SkillNodes, type Node, type SkillNodesType } from "@enshrouded/core";

export type NodeState = "locked" | "selectable" | "selected";

export type NodeArt = {
  // Paths relative to the asset base URL (see assets/ in this package).
  frame: string;
  icon?: string;
  // Drawn at half brightness (selectable skills that aren't selected yet).
  dim: boolean;
  // Extra inset of the icon inside its frame, in tree units.
  iconOffset?: number;
};

const png = (name: string) => (name.includes(".") ? name : `${name}.png`);

// Which frame and icon a node shows in each state. Unselected base nodes
// look selectable.
export const getNodeArt = (node: Node, state: NodeState, tree: SkillNodesType = SkillNodes): NodeArt => {
  const meta = tree.types[node.type];
  const color = meta?.color ?? "blue";
  const hasIcon = !!meta?.hasIcon;
  const hasAsset = !!meta?.hasAsset;
  let frame: string;
  let icon: string | undefined;
  let dim = false;

  if (state === "selected") {
    if (hasIcon) {
      frame = `${color}_${node.tier ?? "large"}`;
      icon = meta.selectedAsset ?? node.type;
    } else if (hasAsset) {
      frame = meta.selectedAsset ?? node.type;
    } else {
      frame = `${color}_${node.tier ?? "small"}`;
    }
  } else if (state === "selectable" || node.base) {
    if (hasIcon) {
      frame = `${color}_${node.tier ?? "large"}`;
      icon = meta.unselectedAsset ?? node.type;
      dim = true;
    } else if (hasAsset) {
      if (meta.selectableAsset) {
        frame = meta.selectableAsset;
      } else if (meta.selectedAsset) {
        frame = meta.selectedAsset;
        dim = true;
      } else {
        frame = node.type;
      }
    } else if (node.tier === "large" && color === "green") {
      frame = "green_large";
      dim = true;
    } else {
      frame = `${color}_${node.tier ?? "small"}_2`;
    }
  } else if (hasIcon) {
    frame = `${node.tier ?? "large"}_gray`;
    icon = meta.unselectedAsset ?? `${node.type}_GRAY`;
  } else if (hasAsset) {
    frame = meta.unselectedAsset ?? `${node.type.toLowerCase()}_gray`;
  } else {
    frame = `${node.tier ?? "small"}_gray`;
  }

  if (node.tier === "large" && state === "selectable" && hasAsset && !meta.selectableAsset) dim = true;

  return {
    frame: `nodes/${png(frame)}`,
    ...(icon ? { icon: `skills/${png(icon)}` } : {}),
    dim,
    ...(meta?.iconOffset != null ? { iconOffset: meta.iconOffset } : {}),
  };
};

export const assetUrl = (assetBaseUrl: string, path: string) => `${assetBaseUrl.replace(/\/+$/, "")}/${path}`;
