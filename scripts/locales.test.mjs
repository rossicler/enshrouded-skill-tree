// Adding a language touches a few lists; this keeps them in step with the
// registry (packages/core/src/locales/locales.json). See packages/README.md.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

import { GAME_LOCALES } from "./skill-data.mjs";
import { SKILL_TEXT_LOCALES, skillTextLoaders } from "../packages/core/src/locales";

const root = path.join(import.meta.dirname, "..");
const codes = SKILL_TEXT_LOCALES.map((info) => info.code);
const { i18n } = createRequire(import.meta.url)("../next-i18next.config.js");

describe("languages", () => {
  it("lists each language once, with a game language ID and a name", () => {
    expect(new Set(codes).size).toBe(codes.length);
    expect(new Set(SKILL_TEXT_LOCALES.map((info) => info.gameLocale)).size).toBe(codes.length);
    for (const info of SKILL_TEXT_LOCALES) {
      expect(info.code).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
      expect(info.gameLocale).toMatch(/^[A-Z][a-z]_[A-Z][a-z]$/);
      expect(info.name).toBeTruthy();
    }
    expect(codes[0]).toBe("en");
  });

  it("has a skill text loader and nodes.json for every language but the bundled English", () => {
    expect(Object.keys(skillTextLoaders).sort()).toEqual(codes.filter((code) => code !== "en").sort());
    for (const code of codes) expect(fs.existsSync(path.join(root, "packages/core/src/locales", code, "nodes.json"))).toBe(true);
  });

  it("imports game text for every language", () => {
    expect(GAME_LOCALES).toEqual(Object.fromEntries(SKILL_TEXT_LOCALES.map((info) => [info.code, info.gameLocale])));
  });

  it("serves the site in every language, with its UI text", () => {
    expect(i18n.locales).toEqual(codes);
    for (const code of codes) {
      expect(fs.existsSync(path.join(root, "public/locales", code, "common.json"))).toBe(true);
      expect(fs.existsSync(path.join(root, "packages/react/src/locales", `${code}.json`))).toBe(true);
    }
  });

  it("has nothing left for a language that is not listed", () => {
    const dirs = fs.readdirSync(path.join(root, "packages/core/src/locales"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    expect(dirs.sort()).toEqual([...codes].sort());
    expect(fs.readdirSync(path.join(root, "public/locales")).sort()).toEqual([...codes].sort());
  });
});
