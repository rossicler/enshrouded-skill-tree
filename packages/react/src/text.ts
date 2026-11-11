import { useCallback } from "react";
import { resolveSkillTextLocale } from "@enshrouded/core";

import de from "./locales/de.json";
import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import it from "./locales/it.json";
import ja from "./locales/ja.json";
import ko from "./locales/ko.json";
import pl from "./locales/pl.json";
import ptBR from "./locales/pt-BR.json";
import ru from "./locales/ru.json";
import th from "./locales/th.json";
import tr from "./locales/tr.json";
import uk from "./locales/uk.json";
import zhCN from "./locales/zh-CN.json";
import zhTW from "./locales/zh-TW.json";
import { useSkillTreeSettings } from "./SkillTreeProvider";

// The package's own UI text (tooltip buttons and labels), one file per
// language in core's SKILL_TEXT_LOCALES (the tests check both lists match).
// Skill names and descriptions come from @enshrouded/core.
export const uiTextResources: Record<string, unknown> = {
  en, de, fr, it, es, ru, pl, ja, ko, "pt-BR": ptBR, th, tr, "zh-CN": zhCN, "zh-TW": zhTW, uk,
};

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

// Text for `key` in `locale` (or the supported language it resolves to), falling back to English.
export const uiText = (locale: string, key: UiTextKey, values: Record<string, string | number> = {}): string => {
  const template = lookup(uiTextResources[resolveSkillTextLocale(locale)], key) ?? lookup(en, key) ?? key;
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
