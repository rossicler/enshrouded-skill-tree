import { describe, expect, it } from "vitest";

import SkillNodes from "../constants/Nodes";
import { getNodesOfType, getSearchCorpus, searchSkills, SEARCH_MIN_QUERY_LENGTH } from "../search";
import { getTotalStats } from "../utils/stats";
import { MAX_FLAME_LEVEL } from "../constants/Biomes";

describe("searchSkills", () => {
  it("needs a few letters", () => {
    expect(SEARCH_MIN_QUERY_LENGTH).toBe(3);
    expect(searchSkills("do", "en")).toEqual([]);
    expect(searchSkills("", "en")).toEqual([]);
  });

  it("ranks name matches first and marks where the query matched", () => {
    const results = searchSkills("double ju", "en");
    expect(results[0].key).toBe("DOUBLE_JUMP");
    expect(results[0].name.slice(results[0].nameMatch!.start, results[0].nameMatch!.end)).toBe("Double Ju");
    const weights = searchSkills("jump", "en").map((r) => (r.nameMatch ? 1 : 0));
    // Name matches come before description-only matches.
    expect(weights).toEqual([...weights].sort((a, b) => b - a));
  });

  it("ignores accents and case, in the locale's own text", () => {
    expect(searchSkills("DOUBLE SA", "fr")[0].key).toBe("DOUBLE_JUMP");
    expect(searchSkills("double sa", "fr")[0].name).toBe("Double saut");
  });

  it("matches only exact names in exact mode", () => {
    expect(searchSkills("Double Jump", "en", { exact: true }).map((r) => r.key)).toEqual(["DOUBLE_JUMP"]);
    expect(searchSkills("Double Ju", "en", { exact: true })).toEqual([]);
  });

  it("builds each locale's corpus once", () => {
    expect(getSearchCorpus("en")).toBe(getSearchCorpus("en"));
    expect(getSearchCorpus("fr")).not.toBe(getSearchCorpus("en"));
  });

  it("finds the nodes of a type", () => {
    expect(getNodesOfType("DOUBLE_JUMP")).toEqual(["12"]);
    expect(getNodesOfType("ATTR_STR").length).toBeGreaterThan(1);
    expect(getNodesOfType("NOPE")).toEqual([]);
    for (const id of getNodesOfType("ATTR_STR")) expect(SkillNodes.nodes[id].type).toBe("ATTR_STR");
  });
});

describe("getTotalStats", () => {
  it("lists every basic stat, adds the flame altar and clamps the flame level", () => {
    expect(getTotalStats({})).toEqual({ CONS: 0, STR: 0, ENDURANCE: 0, DEX: 0, SPIRIT: 0, INT: 0 });
    expect(getTotalStats({}, 3).STR).toBe(2);
    expect(getTotalStats({}, MAX_FLAME_LEVEL + 5).STR).toBe(MAX_FLAME_LEVEL - 1);
    const strNode = getNodesOfType("ATTR_STR")[0];
    const perLevel = SkillNodes.types.ATTR_STR.stats!.STR!;
    expect(getTotalStats({ [strNode]: 1 }, 2).STR).toBe(perLevel + 1);
    expect(getTotalStats([strNode]).STR).toBe(perLevel);
  });
});
