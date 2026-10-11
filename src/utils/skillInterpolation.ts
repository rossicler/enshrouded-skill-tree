import { NodeTypeMetadata } from "@/constants/Nodes";
import { baseLanguage } from "@/utils/skillText";

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

// The default locale's game values with the language's overrides applied.
const localeGameValues = (metadata: NodeTypeMetadata | undefined, language: string) => {
  const local = metadata?.gameLocaleValues?.[baseLanguage(language)];
  return {
    gameValues: { ...metadata?.gameValues, ...local?.gameValues },
    gameLevelValues: { ...metadata?.gameLevelValues, ...local?.gameLevelValues },
    gamePerLevelValues: { ...metadata?.gamePerLevelValues, ...local?.gamePerLevelValues },
  };
};

export const getGameInterpolationValues = (
  metadata: NodeTypeMetadata | undefined,
  displayLevel: number,
  language: string,
): Record<string, number | string> => {
  const { gameValues, gameLevelValues } = localeGameValues(metadata, language);
  const interpolation: Record<string, number | string> = { ...gameValues };
  for (const [key, values] of Object.entries(gameLevelValues)) {
    const value = values[displayLevel - 1] ?? values[values.length - 1];
    if (value != null) interpolation[key] = value;
  }
  return interpolation;
};

// Values for the game per-level line ({{gamePerLevelValueN}}).
export const getGamePerLevelValues = (
  metadata: NodeTypeMetadata | undefined,
  language: string,
): Record<string, number | string> => localeGameValues(metadata, language).gamePerLevelValues;
