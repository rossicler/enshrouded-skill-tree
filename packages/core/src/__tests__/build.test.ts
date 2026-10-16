import { describe, expect, it } from "vitest";

import {
  InvalidSkillBuildError,
  SkillBuild,
  buildToSelection,
  decodeSkillBuild,
  encodeSkillBuild,
  parseSkillBuild,
  selectionToBuild,
} from "../build";
import { SKILL_TREE_CONTENT_HASH } from "../constants/skillTreeVersion";

// Frozen share codes. Links already shared carry these exact strings, so the
// format must never change: these tests fail if a code would be written or
// read differently.
const ALL_BIOMES = ["springlands", "revelwood", "nomad_highlands", "kindlewastes", "albaneve_summits", "veilwater_basin"];
const HASH = "6ece8bfae998308b999ce2db66684a02ca8118836c7d3e88e6672921379ba300";

const FIXTURES: { name: string; code: string; build: SkillBuild | string[] }[] = [
  {
    // The first format: a plain list of skill IDs.
    name: "legacy string[]",
    code: "WyIxNyIsIjIiLCIxIl0=",
    build: ["17", "2", "1"],
  },
  {
    // Levels, without tree version or budget.
    name: "levels only",
    code: "eyJza2lsbHMiOlsiMiIsIjEiXSwic2tpbGxMZXZlbHMiOnsiMiI6Mn19",
    build: { skills: ["2", "1"], skillLevels: { "2": 2 } },
  },
  {
    // What the share dialog writes for single-level skills.
    name: "current, single levels",
    code:
      "eyJza2lsbHMiOlsiMTciXSwidHJlZUNvbnRlbnRIYXNoIjoiNmVjZThiZmFlOTk4MzA4Yjk5OWNlMmRiNjY2ODRhMDJjYTgxMTg4MzZjN2QzZTg4ZTY2NzI5MjEzNzliYTMwMCIsInBsYXllckxldmVsIjo0NSwidW5sb2NrZWRCaW9tZXMiOlsic3ByaW5nbGFuZHMiLCJyZXZlbHdvb2QiLCJub21hZF9oaWdobGFuZHMiLCJraW5kbGV3YXN0ZXMiLCJhbGJhbmV2ZV9zdW1taXRzIiwidmVpbHdhdGVyX2Jhc2luIl19",
    build: { skills: ["17"], treeContentHash: HASH, playerLevel: 45, unlockedBiomes: ALL_BIOMES },
  },
  {
    // What the share dialog writes once a skill is above level 1.
    name: "current, with levels",
    code:
      "eyJza2lsbHMiOlsiMiIsIjEiXSwidHJlZUNvbnRlbnRIYXNoIjoiNmVjZThiZmFlOTk4MzA4Yjk5OWNlMmRiNjY2ODRhMDJjYTgxMTg4MzZjN2QzZTg4ZTY2NzI5MjEzNzliYTMwMCIsInNraWxsTGV2ZWxzIjp7IjEiOjEsIjIiOjN9LCJwbGF5ZXJMZXZlbCI6MjAsInVubG9ja2VkQmlvbWVzIjpbInNwcmluZ2xhbmRzIl19",
    build: { skills: ["2", "1"], treeContentHash: HASH, skillLevels: { "2": 3, "1": 1 }, playerLevel: 20, unlockedBiomes: ["springlands"] },
  },
];

describe("skill build codes", () => {
  it.each(FIXTURES)("decode the frozen $name code", ({ code, build }) => {
    expect(decodeSkillBuild(code)).toEqual(Array.isArray(build) ? { skills: build } : build);
  });

  it.each(FIXTURES.filter((f) => !Array.isArray(f.build)))("encode $name byte for byte", ({ code, build }) => {
    expect(encodeSkillBuild(build as SkillBuild)).toBe(code);
  });

  it("is base64 of the build's JSON", () => {
    const build: SkillBuild = { skills: ["5", "3"], playerLevel: 12 };
    expect(encodeSkillBuild(build)).toBe(btoa(JSON.stringify(build)));
    expect(decodeSkillBuild(encodeSkillBuild(build))).toEqual(build);
  });

  it("rejects what is not a build code", () => {
    expect(() => decodeSkillBuild("not-a-code")).toThrow(InvalidSkillBuildError);
    expect(() => decodeSkillBuild(btoa("{}"))).toThrow(InvalidSkillBuildError);
    expect(() => decodeSkillBuild(btoa("null"))).toThrow(InvalidSkillBuildError);
    expect(() => decodeSkillBuild(btoa('{"skills":"1"}'))).toThrow(InvalidSkillBuildError);
  });
});

describe("selectionToBuild", () => {
  it("writes the fields in the frozen order", () => {
    const code = encodeSkillBuild(
      selectionToBuild({ "2": 3, "1": 1 }, { treeContentHash: HASH, playerLevel: 20, unlockedBiomes: ["springlands"] })
    );
    // A selection lists integer-like IDs in ascending order (JS object key order).
    expect(code).toBe(
      "eyJza2lsbHMiOlsiMSIsIjIiXSwidHJlZUNvbnRlbnRIYXNoIjoiNmVjZThiZmFlOTk4MzA4Yjk5OWNlMmRiNjY2ODRhMDJjYTgxMTg4MzZjN2QzZTg4ZTY2NzI5MjEzNzliYTMwMCIsInNraWxsTGV2ZWxzIjp7IjEiOjEsIjIiOjN9LCJwbGF5ZXJMZXZlbCI6MjAsInVubG9ja2VkQmlvbWVzIjpbInNwcmluZ2xhbmRzIl19"
    );
    expect(
      encodeSkillBuild(selectionToBuild({ "17": 1 }, { treeContentHash: HASH, playerLevel: 45, unlockedBiomes: ALL_BIOMES }))
    ).toBe(FIXTURES[2].code);
  });

  it("adds skillLevels only when a skill is above level 1", () => {
    expect(selectionToBuild({ "17": 1 })).toEqual({ skills: ["17"], treeContentHash: SKILL_TREE_CONTENT_HASH });
    expect(selectionToBuild({ "2": 2 }).skillLevels).toEqual({ "2": 2 });
  });
});

describe("buildToSelection", () => {
  it("reads levels, defaulting to 1", () => {
    expect(buildToSelection({ skills: ["2", "1"], skillLevels: { "2": 3 } })).toEqual({ "2": 3, "1": 1 });
  });

  it("ignores levels of skills not in the list and floors levels to at least 1", () => {
    expect(buildToSelection({ skills: ["2"], skillLevels: { "2": 2.7, "9": 3 } })).toEqual({ "2": 2 });
    expect(buildToSelection({ skills: ["2"], skillLevels: { "2": 0 } })).toEqual({ "2": 1 });
  });

  it("round-trips a selection", () => {
    const selection = { "17": 1, "2": 3, "1": 1 };
    expect(buildToSelection(decodeSkillBuild(encodeSkillBuild(selectionToBuild(selection))))).toEqual(selection);
  });
});

describe("parseSkillBuild", () => {
  it("accepts a legacy id list and a build object", () => {
    expect(parseSkillBuild(["1", "2"])).toEqual({ skills: ["1", "2"] });
    expect(parseSkillBuild({ skills: ["1"], playerLevel: 3 })).toEqual({ skills: ["1"], playerLevel: 3 });
  });

  it("rejects anything else", () => {
    expect(parseSkillBuild([1, 2])).toBeNull();
    expect(parseSkillBuild({ skill: [] })).toBeNull();
    expect(parseSkillBuild(null)).toBeNull();
    expect(parseSkillBuild("1,2")).toBeNull();
  });
});
