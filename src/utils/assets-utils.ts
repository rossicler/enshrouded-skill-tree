import SkillNodes, { Node } from "../constants/Nodes";

export const getAsset = (
  node: Node,
  selected: boolean,
  selectable?: boolean
): [boolean, string] => {
  let assetName = `${node.tier ?? "small"}`;
  let lowBrithness = false;
  const nodeMetadata = SkillNodes.types[node.type];
  const hasSpecificAsset = nodeMetadata && nodeMetadata.hasAsset;

  if (selected) {
    if (hasSpecificAsset) {
      assetName = nodeMetadata.selectedAsset ?? node.type;
    } else {
      // TODO: change blue/red/green/gold based on node
      assetName = `${nodeMetadata?.color ?? "blue"}_${node.tier ?? "small"}`;
    }
  } else if (selectable || node.base) {
    if (hasSpecificAsset) {
      assetName = nodeMetadata.selectableAsset ?? `${node.type}`;
    } else if (node.tier === "large" && nodeMetadata.color === "green") {
      assetName = `green_large`;
      lowBrithness = true;
    } else {
      assetName = `${nodeMetadata?.color ?? "blue"}_${node.tier ?? "small"}_2`;
    }
  } else {
    if (hasSpecificAsset) {
      assetName =
        nodeMetadata.unselectedAsset ?? `${node.type.toLowerCase()}_gray`;
    } else {
      assetName = `${node.tier ?? "small"}_gray`;
    }
  }

  if (
    node.tier === "large" &&
    selectable &&
    hasSpecificAsset &&
    !nodeMetadata.selectableAsset
  ) {
    lowBrithness = true;
  }

  if (!assetName.includes(".")) assetName = `${assetName}.png`;
  return [lowBrithness, `/assets/${assetName}`];
};
