import SkillNodes, { Node } from "../constants/Nodes";

export const getAsset = (
  node: Node,
  selected: boolean,
  selectable?: boolean
) => {
  let assetName = `${node.tier ?? "small"}`;
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
      assetName =
        nodeMetadata.selectableAsset ?? `${node.type.toLowerCase()}_gray`;
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

  if (!assetName.includes(".")) assetName = `${assetName}.png`;
  return `/assets/${assetName}`;
};
