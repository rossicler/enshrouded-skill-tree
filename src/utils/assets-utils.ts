import { SkillNodes, Node } from "@enshrouded/core";

export const getAsset = (
  node: Node,
  selected: boolean,
  selectable?: boolean
): [boolean, string, string | undefined, number | undefined] => {
  let assetName = `${node.tier ?? "small"}`;
  let lowBrithness = false;
  let iconAsset: string | undefined = undefined;
  const nodeMetadata = SkillNodes.types[node.type];
  const hasSpecificAsset = nodeMetadata && nodeMetadata.hasAsset;
  const hasIcon = nodeMetadata && nodeMetadata.hasIcon;

  if (selected) {
    if (hasIcon) {
      assetName = `${nodeMetadata?.color ?? "blue"}_${node.tier ?? "large"}`;
      iconAsset = `skills/${nodeMetadata.selectedAsset ?? node.type}`;
    } else if (hasSpecificAsset) {
      assetName = nodeMetadata.selectedAsset ?? node.type;
    } else {
      // TODO: change blue/red/green/gold based on node
      assetName = `${nodeMetadata?.color ?? "blue"}_${node.tier ?? "small"}`;
    }
  } else if (selectable || node.base) {
    if (hasIcon) {
      assetName = `${nodeMetadata?.color ?? "blue"}_${node.tier ?? "large"}`;
      iconAsset = `skills/${nodeMetadata.unselectedAsset ?? node.type}`;
      lowBrithness = true;
    } else if (hasSpecificAsset) {
      if (nodeMetadata.selectableAsset) {
        assetName = nodeMetadata.selectableAsset;
      } else if (nodeMetadata.selectedAsset) {
        assetName = nodeMetadata.selectedAsset;
        lowBrithness = true;
      } else {
        assetName = node.type;
      }
    } else if (node.tier === "large" && nodeMetadata.color === "green") {
      assetName = `green_large`;
      lowBrithness = true;
    } else {
      assetName = `${nodeMetadata?.color ?? "blue"}_${node.tier ?? "small"}_2`;
    }
  } else {
    if (hasIcon) {
      assetName = `${node.tier ?? "large"}_gray`;
      iconAsset = `skills/${
        nodeMetadata.unselectedAsset ?? node.type + "_GRAY"
      }`;
    } else if (hasSpecificAsset) {
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
  if (iconAsset && !iconAsset.includes(".")) iconAsset = `${iconAsset}.png`;
  return [
    lowBrithness,
    `/assets/${assetName}`,
    iconAsset ? `/assets/${iconAsset}` : undefined,
    nodeMetadata?.iconOffset,
  ];
};
