import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { getGameInterpolationValues, getSkillInterpolationValues } from "../src/utils/skillInterpolation";
import { usesGameText } from "../src/utils/skillText";

const { collectProblems, scanSource, placeholders } = createRequire(import.meta.url)("./validate-translations.js");

// GAME shows imported English game text in en; LEGACY has no game text.
const fixture = () => ({
  defaultLocale: "en",
  presentationTypes: ["GAME", "LEGACY"],
  tree: {
    types: {
      GAME: {
        importedEnglish: true,
        maxLevel: 2,
        gameLevelValues: { gameValue1: ["5%", "10%"] },
        gamePerLevelValues: { gameValue1: "5%" },
        perLevel: { value: 5, label: "<b>{{value}}%</b> per level" },
      },
      LEGACY: { maxLevel: 1, levelValues: { amount: [3] } },
    },
  },
  locales: {
    en: {
      nodes: {
        GAME: {
          description: ["Legacy {{value}}"],
          game: { name: "Game", description: ["Up to {{gameValue1}}"], perLevelLabel: "{{gameValue1}} per level" },
        },
        LEGACY: { name: "Legacy", description: ["Adds {{amount}}"] },
      },
      common: { hud: { title: "Title", count_one: "{{count}} skill", count_other: "{{count}} skills" }, biomes: { springlands: "Springlands" } },
    },
    fr: {
      nodes: {
        GAME: { name: "Jeu", description: ["Jusqu'à {{value}}"], perLevelLabel: "{{value}}% par niveau" },
        LEGACY: { name: "Ancien", description: ["Ajoute {{amount}}"] },
      },
      common: { hud: { title: "Titre", count_one: "{{count}} compétence", count_many: "{{count}} compétences", count_other: "{{count}} compétences" }, biomes: { springlands: "Terres printanières" } },
    },
  },
  usesGameText,
  interpolation: { game: getGameInterpolationValues, skill: getSkillInterpolationValues },
  families: { "biomes.": ["springlands"] },
  references: { keys: [{ key: "hud.title", file: "src/a.tsx", call: true }], templates: [{ template: "biomes.${id}", file: "src/b.tsx" }] },
});

const messages = (input) => collectProblems(input).map(({ file, message }) => `${file}: ${message}`);

describe("validate-translations", () => {
  it("accepts complete translations", () => {
    expect(messages(fixture())).toEqual([]);
  });

  it("requires a name in the record each locale shows", () => {
    const input = fixture();
    delete input.locales.fr.nodes.GAME.name;
    expect(messages(input)).toEqual(["fr/nodes.json: GAME.name is missing, so the tooltip, search and toasts would show the type key"]);
  });

  it("requires every description placeholder to have a value at every level", () => {
    const input = fixture();
    input.locales.fr.nodes.LEGACY.description = ["Ajoute {{amount}} et {{other}}"];
    input.locales.en.nodes.GAME.game.description = ["Up to {{gameValue2}}"];
    expect(messages(input)).toEqual([
      "en/nodes.json: GAME.game.description uses {{gameValue2}}, which has no value at level 1",
      "fr/nodes.json: LEGACY.description uses {{other}}, which has no value at level 1",
    ]);
  });

  it("requires a translated per-level line outside the default locale", () => {
    const input = fixture();
    delete input.locales.fr.nodes.GAME.perLevelLabel;
    expect(messages(input)).toEqual([
      'fr/nodes.json: GAME.perLevelLabel is missing, so the tooltip would show the English "<b>{{value}}%</b> per level"',
    ]);
  });

  it("requires a game per-level line when the type has per-level game values", () => {
    const input = fixture();
    delete input.locales.en.nodes.GAME.game.perLevelLabel;
    expect(messages(input)).toEqual(["en/nodes.json: GAME.game.perLevelLabel is missing, so the tooltip would show no per-level line"]);
  });

  it("requires an entry for every authored type", () => {
    const input = fixture();
    input.presentationTypes.push("UNUSED");
    expect(messages(input)).toEqual([
      "en/nodes.json: UNUSED is missing (every type authored in LegacyNodes.ts needs an entry)",
      "fr/nodes.json: UNUSED is missing (every type authored in LegacyNodes.ts needs an entry)",
    ]);
  });

  it("matches common.json keys and placeholders against the default locale", () => {
    const input = fixture();
    input.locales.fr.common.hud = { title: "Titre {{name}}", extra: "Extra" };
    expect(messages(input)).toEqual([
      "fr/common.json: hud.title uses {{name}}, but en uses none",
      "fr/common.json: hud.count is missing (it is in en/common.json)",
      "fr/common.json: hud.extra is not in en/common.json",
    ]);
  });

  it("requires keys referenced in code and every value of a runtime-built key", () => {
    const input = fixture();
    input.references.keys.push(
      { key: "hud.missing", file: "src/c.tsx", call: false },
      { key: "next.config", file: "src/d.tsx", call: false }, // not a common.json section
      { key: "GAME.name", file: "src/e.tsx", call: true }, // nodes namespace
    );
    input.families["biomes."].push("revelwood");
    expect(messages(input)).toEqual([
      "en/common.json: hud.missing is missing (used in src/c.tsx)",
      "fr/common.json: hud.missing is missing (used in src/c.tsx)",
      "en/common.json: biomes.revelwood is missing (one key per value of biomes.*)",
      "fr/common.json: biomes.revelwood is missing (one key per value of biomes.*)",
    ]);
  });

  it("rejects runtime-built keys it can't list", () => {
    const input = fixture();
    input.references.templates.push({ template: "stats.${stat}", file: "src/f.tsx" });
    expect(messages(input)).toEqual([
      "src/f.tsx: t(`stats.${stat}`) builds keys this check can't list; list its values under families in loadApp() in scripts/validate-translations.js",
    ]);
  });

  it("finds literal, Trans and template keys in source files", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "translations-"));
    fs.mkdirSync(path.join(dir, "__tests__"));
    fs.writeFileSync(path.join(dir, "a.tsx"), [
      `t("hud.title"); t('errors.notFound', "Not found");`,
      `<Trans i18nKey="dialogs.about" />`,
      `const LABELS = { STR: "stats.strength" };`,
      "t(`biomes.${biome.id}`); t(`${type}.name`);",
    ].join("\n"));
    fs.writeFileSync(path.join(dir, "__tests__", "skip.tsx"), `t("ignored.key");`);
    const { keys, templates } = scanSource(dir);
    expect(keys.filter((k) => k.call).map((k) => k.key)).toEqual(["hud.title", "errors.notFound", "dialogs.about"]);
    expect(keys.map((k) => k.key)).toContain("stats.strength");
    expect(keys.map((k) => k.key)).not.toContain("ignored.key");
    expect(templates.map((t) => t.template)).toEqual(["biomes.${biome.id}", "${type}.name"]);
  });

  it("reads i18next placeholder forms", () => {
    expect(placeholders("{{a}} {{ b, number }} {{- c}} {{a}}")).toEqual(["a", "b", "c"]);
  });
});
