import { NodeTypeMetadata } from "@/constants/Nodes";

export const getSkillInterpolationValues = (
  metadata: NodeTypeMetadata | undefined,
  displayLevel: number,
): Record<string, number | string> => {
  const interpolation: Record<string, number | string> = {};
  if (metadata?.levelValues) {
    Object.entries(metadata.levelValues).forEach(([k, arr]) => {
      const v = arr[displayLevel - 1] ?? arr[arr.length - 1];
      if (v != null) interpolation[k] = v;
    });
  }
  if (metadata?.perLevel) {
    const { value, value2 } = metadata.perLevel;
    interpolation.value =
      typeof value === "number" ? value * displayLevel : value;
    if (value2 != null) {
      interpolation.value2 =
        typeof value2 === "number" ? value2 * displayLevel : value2;
    }
  }
  return interpolation;
};
