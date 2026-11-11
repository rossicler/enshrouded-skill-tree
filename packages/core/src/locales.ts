// The languages skill text comes in, and loading their text on demand.
//
// To add a language the game has: add it to locales/locales.json (app code,
// the game's language ID, its own name), add its loader below, and run the
// skill import (`yarn import-skills <export> --apply`), which writes
// locales/<code>/nodes.json from the game's text. See packages/README.md.
//
// English is bundled and is the fallback for every missing text. Other
// languages load with loadSkillText (a separate chunk in browser bundles)
// or addSkillText (text the host already has, such as server-loaded props).
import registry from "./locales/locales.json";

export type SkillTextLocaleInfo = {
  // The app's locale code (BCP 47), e.g. "de" or "pt-BR".
  code: string;
  // The game's language ID, e.g. "De_De".
  gameLocale: string;
  // The language's own name, for a language picker.
  name: string;
  // Other locale codes this language answers to (e.g. "zh-HK" for "zh-TW").
  aliases?: string[];
};

// Skill text resources of one locale: per-type text ("nodes") and, optionally,
// tree labels ("tree"; English is used when a locale has none).
export type SkillTextResources = {
  // The supported locale code the text is for.
  locale: string;
  nodes: Record<string, unknown>;
  tree?: Record<string, unknown>;
};

export const SKILL_TEXT_LOCALES: readonly SkillTextLocaleInfo[] = registry;
export const DEFAULT_SKILL_TEXT_LOCALE = "en";

// One per language in locales.json except English (bundled in text.ts).
// scripts/locales.test.mjs checks that the two lists match.
type Loader = () => Promise<{ default: unknown }>;
export const skillTextLoaders: Record<string, Loader> = {
  de: () => import("./locales/de/nodes.json"),
  fr: () => import("./locales/fr/nodes.json"),
  it: () => import("./locales/it/nodes.json"),
  es: () => import("./locales/es/nodes.json"),
  ru: () => import("./locales/ru/nodes.json"),
  pl: () => import("./locales/pl/nodes.json"),
  ja: () => import("./locales/ja/nodes.json"),
  ko: () => import("./locales/ko/nodes.json"),
  "pt-BR": () => import("./locales/pt-BR/nodes.json"),
  th: () => import("./locales/th/nodes.json"),
  tr: () => import("./locales/tr/nodes.json"),
  "zh-CN": () => import("./locales/zh-CN/nodes.json"),
  "zh-TW": () => import("./locales/zh-TW/nodes.json"),
  uk: () => import("./locales/uk/nodes.json"),
};

const lower = (code: string) => code.toLowerCase().replace(/_/g, "-");

// The supported locale for any locale code: an exact code or alias (also as
// a prefix, "zh-Hant-HK" -> an entry listing "zh-Hant"), then the first
// language with the same base ("fr-CA" -> "fr", "pt" -> "pt-BR"), else English.
export const resolveSkillTextLocale = (locale: string | undefined): string => {
  if (!locale) return DEFAULT_SKILL_TEXT_LOCALE;
  const wanted = lower(locale);
  const matches = (code: string) => wanted === lower(code) || wanted.startsWith(`${lower(code)}-`);
  const exact =
    SKILL_TEXT_LOCALES.find((info) => wanted === lower(info.code)) ??
    SKILL_TEXT_LOCALES.find((info) => (info.aliases ?? []).some(matches)) ??
    SKILL_TEXT_LOCALES.find((info) => matches(info.code));
  if (exact) return exact.code;
  const base = wanted.split("-")[0];
  return SKILL_TEXT_LOCALES.find((info) => lower(info.code).split("-")[0] === base)?.code ?? DEFAULT_SKILL_TEXT_LOCALE;
};
