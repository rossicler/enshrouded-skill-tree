import { describe, expect, it } from "vitest";

import { NodeTypeMetadata } from "@/constants/Nodes";
import { getGameInterpolationValues, getGamePerLevelValues, getSkillInterpolationValues } from "../skillInterpolation";
import { skillTextPrefix, usesGameText } from "../skillText";

const base: NodeTypeMetadata = {
  description: [],
  color: "green",
  cost: 1,
};

describe("getSkillInterpolationValues", () => {
  it("returns empty object without levelValues or perLevel", () => {
    expect(getSkillInterpolationValues(base, 1)).toEqual({});
    expect(getSkillInterpolationValues(undefined, 1)).toEqual({});
  });

  it("picks the per-level value from levelValues", () => {
    const meta = { ...base, levelValues: { value: [10, 20, 30] } };
    expect(getSkillInterpolationValues(meta, 1)).toEqual({ value: 10 });
    expect(getSkillInterpolationValues(meta, 3)).toEqual({ value: 30 });
  });

  it("falls back to the last levelValues entry when level exceeds the array", () => {
    const meta = { ...base, levelValues: { value: [10, 20] } };
    expect(getSkillInterpolationValues(meta, 5)).toEqual({ value: 20 });
  });

  it("multiplies numeric perLevel values by the display level", () => {
    const meta = {
      ...base,
      perLevel: { value: 5, value2: 2, label: "x" },
    };
    expect(getSkillInterpolationValues(meta, 3)).toEqual({
      value: 15,
      value2: 6,
    });
  });

  it("passes through non-numeric perLevel values", () => {
    const meta = { ...base, perLevel: { value: "5-10", label: "x" } };
    expect(getSkillInterpolationValues(meta, 2)).toEqual({ value: "5-10" });
  });
});

describe("game text values per locale", () => {
  const meta: NodeTypeMetadata = {
    ...base,
    maxLevel: 2,
    gameTextLocales: ["en", "fr"],
    gameValues: { gameValue1: "[Jump]" },
    gameLevelValues: { gameValue2: ["5%", "10%"] },
    gamePerLevelValues: { gamePerLevelValue1: "5%" },
    gameLocaleValues: { fr: { gameValues: { gameValue1: "[Sauter]" } } },
  };

  it("applies a locale's overrides over the default locale's values", () => {
    expect(getGameInterpolationValues(meta, 2, "en")).toEqual({ gameValue1: "[Jump]", gameValue2: "10%" });
    expect(getGameInterpolationValues(meta, 2, "fr-CA")).toEqual({ gameValue1: "[Sauter]", gameValue2: "10%" });
    expect(getGamePerLevelValues(meta, "fr")).toEqual({ gamePerLevelValue1: "5%" });
  });

  it("shows game text only in locales the import wrote", () => {
    expect(usesGameText(meta, "fr")).toBe(true);
    expect(skillTextPrefix("SKILL", meta, "fr-FR")).toBe("SKILL.game");
    expect(usesGameText({ ...meta, gameTextLocales: ["en"] }, "fr")).toBe(false);
    expect(skillTextPrefix("SKILL", base, "en")).toBe("SKILL");
  });
});
