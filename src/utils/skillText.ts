import type { NodeTypeMetadata } from "@/constants/Nodes";

// Imported game text is English. English always uses it; other locales use
// their own translation, falling back to the game text for types they lack
// (e.g. skills added by a game update and not yet translated).
export const usesGameText = (
  metadata: NodeTypeMetadata | undefined,
  language: string,
  hasOwnText: boolean,
): boolean => Boolean(metadata?.importedEnglish) && (language.split("-")[0] === "en" || !hasOwnText);

type ResourceReader = {
  getResource: (lng: string, ns: string, key: string) => unknown;
};

export const hasLocaleText = (i18n: ResourceReader, language: string, type: string): boolean =>
  i18n.getResource(language, "nodes", `${type}.description`) != null;
