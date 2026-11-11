import type { NodeTypeMetadata } from "../constants/Nodes";
import { resolveSkillTextLocale } from "../locales";

// "fr-CA" -> "fr", "zh-HK" -> "zh-TW": imported game text is keyed by the
// app's locale codes (see resolveSkillTextLocale).
export const baseLanguage = (language: string): string => resolveSkillTextLocale(language);

// A locale shows the imported game text for a type when the import wrote that
// locale's text (gameTextLocales); otherwise it shows its own translation.
export const usesGameText = (
  metadata: NodeTypeMetadata | undefined,
  language: string,
): boolean => Boolean(metadata?.gameTextLocales?.includes(resolveSkillTextLocale(language)));

// Key prefix in the "nodes" namespace for the text a locale shows for a type.
// The tooltip, search, toasts and scripts/validate-translations.js all use it.
export const skillTextPrefix = (
  type: string,
  metadata: NodeTypeMetadata | undefined,
  language: string,
): string => (usesGameText(metadata, language) ? `${type}.game` : type);
