import type { NodeTypeMetadata } from "@/constants/Nodes";

// Imported game text is English: English shows it for types that have it, and
// other locales show their own translation.
export const usesGameText = (
  metadata: NodeTypeMetadata | undefined,
  language: string,
): boolean => Boolean(metadata?.importedEnglish) && language.split("-")[0] === "en";
