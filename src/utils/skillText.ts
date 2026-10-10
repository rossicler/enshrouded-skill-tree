import type { NodeTypeMetadata } from "@/constants/Nodes";

// Imported game text is English: English shows it for types that have it, and
// other locales show their own translation.
export const usesGameText = (
  metadata: NodeTypeMetadata | undefined,
  language: string,
): boolean => Boolean(metadata?.importedEnglish) && language.split("-")[0] === "en";

// Key prefix in the "nodes" namespace for the text a locale shows for a type.
// The tooltip, search, toasts and scripts/validate-translations.js all use it.
export const skillTextPrefix = (
  type: string,
  metadata: NodeTypeMetadata | undefined,
  language: string,
): string => (usesGameText(metadata, language) ? `${type}.game` : type);
