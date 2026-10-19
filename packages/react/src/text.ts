import { useCallback } from "react";

import en from "./locales/en.json";
import fr from "./locales/fr.json";
import { useSkillTreeSettings } from "./SkillTreeProvider";

// The package's own UI text (tooltip buttons and labels). Skill names and
// descriptions come from @enshrouded/core.
export const uiTextResources = { en, fr } as const;

type Leaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type UiTextKey = Leaves<typeof en>;

const lookup = (messages: unknown, key: string): string | undefined => {
  let value = messages;
  for (const part of key.split(".")) {
    if (!value || typeof value !== "object") return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return typeof value === "string" ? value : undefined;
};

// Text for `key` in `locale` (or its base language), falling back to English.
export const uiText = (locale: string, key: UiTextKey, values: Record<string, string | number> = {}): string => {
  const language = locale.split("-")[0] as keyof typeof uiTextResources;
  const template = lookup(uiTextResources[language], key) ?? lookup(en, key) ?? key;
  return template.replace(/{{\s*(\w+)\s*}}/g, (match, name: string) => (name in values ? String(values[name]) : match));
};

// uiText bound to the provider's locale.
export const useUiText = () => {
  const { locale } = useSkillTreeSettings();
  return useCallback(
    (key: UiTextKey, values?: Record<string, string | number>) => uiText(locale, key, values),
    [locale]
  );
};
