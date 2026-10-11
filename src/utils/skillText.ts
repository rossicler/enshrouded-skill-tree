import type { NodeTypeMetadata } from "@/constants/Nodes";

// "fr-CA" -> "fr": imported game text is keyed by the app's base locales.
export const baseLanguage = (language: string): string => language.split("-")[0];

// A locale shows the imported game text for a type when the import wrote that
// locale's text (gameTextLocales); otherwise it shows its own translation.
export const usesGameText = (
  metadata: NodeTypeMetadata | undefined,
  language: string,
): boolean => Boolean(metadata?.gameTextLocales?.includes(baseLanguage(language)));

// Key prefix in the "nodes" namespace for the text a locale shows for a type.
// The tooltip, search, toasts and scripts/validate-translations.js all use it.
export const skillTextPrefix = (
  type: string,
  metadata: NodeTypeMetadata | undefined,
  language: string,
): string => (usesGameText(metadata, language) ? `${type}.game` : type);
