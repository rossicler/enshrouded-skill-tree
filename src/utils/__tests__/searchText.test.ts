import { describe, expect, it } from "vitest";

import {
  SNIPPET_MAX_LENGTH,
  buildSnippet,
  mapRangeToOriginal,
  normalizeForSearch,
  normalizeQuery,
  scoreMatch,
  stripHtml,
} from "../searchText";

describe("normalizeForSearch", () => {
  it("lowercases and strips accents", () => {
    expect(normalizeForSearch("Dégâts", "fr").norm).toBe("degats");
    expect(normalizeForSearch("MELEE", "en").norm).toBe("melee");
  });

  it("maps normalized indices back to the original string", () => {
    const nt = normalizeForSearch("Les dégâts", "fr");
    const idx = nt.norm.indexOf("degats");
    const range = mapRangeToOriginal(nt, idx, idx + "degats".length);
    expect(nt.original.slice(range.start, range.end)).toBe("dégâts");
  });

  it("extends a match ending mid-expansion to the whole original char", () => {
    // Simulates a one-to-many fold (e.g. one original char producing "ss"):
    // original "aXb" where X normalizes to "ss" -> norm "assb"
    const nt = { original: "aXb", norm: "assb", map: [0, 1, 1, 2] };
    // Match "as" ends inside X's expansion; highlight must cover all of X
    const range = mapRangeToOriginal(nt, 0, 2);
    expect(nt.original.slice(range.start, range.end)).toBe("aX");
  });
});

describe("normalizeQuery", () => {
  it("trims, lowercases, and strips accents", () => {
    expect(normalizeQuery("  Dégâts ", "fr")).toBe("degats");
  });
});

describe("stripHtml", () => {
  it("strips tags and converts <br> to a space", () => {
    expect(
      stripHtml("<b>Parry</b><br/>A well-timed <i>block</i>."),
    ).toBe("Parry A well-timed block.");
  });

  it("decodes common entities and collapses whitespace", () => {
    expect(stripHtml("a &amp; b&nbsp;&nbsp;c &#39;d&#39;")).toBe("a & b c 'd'");
  });
});

describe("scoreMatch", () => {
  const entry = (name: string, desc: string, locale = "en") => ({
    name: normalizeForSearch(name, locale),
    desc: normalizeForSearch(desc, locale),
  });

  it("weights exact name > partial name > description", () => {
    const e = entry("MELEE MASTER", "All melee blunt damage is increased.");
    expect(scoreMatch(e.name, e.desc, "melee master").weight).toBe(3);
    expect(scoreMatch(e.name, e.desc, "melee").weight).toBe(2);

    const descOnly = entry("BLUNT EXPERT", "All melee blunt damage.");
    expect(scoreMatch(descOnly.name, descOnly.desc, "melee").weight).toBe(1);

    expect(scoreMatch(e.name, e.desc, "ranged").weight).toBe(0);
  });

  it("returns description match even when the name matches", () => {
    const e = entry("MELEE MASTER", "All melee blunt damage.");
    const result = scoreMatch(e.name, e.desc, "melee");
    expect(result.nameMatch).toBeDefined();
    expect(result.descMatch).toBeDefined();
  });

  it("is accent-insensitive with correct original highlight range", () => {
    const e = entry("OPPORTUNITÉ", "Les dégâts sont augmentés.", "fr");
    const result = scoreMatch(e.name, e.desc, normalizeQuery("degats", "fr"));
    expect(result.weight).toBe(1);
    const { start, end } = result.descMatch!;
    expect("Les dégâts sont augmentés.".slice(start, end)).toBe("dégâts");
  });

  it("reports match position for tie-breaking", () => {
    const early = entry("X", "melee damage first");
    const late = entry("Y", "damage from melee attacks");
    expect(
      scoreMatch(early.name, early.desc, "melee").position,
    ).toBeLessThan(scoreMatch(late.name, late.desc, "melee").position);
  });
});

describe("buildSnippet", () => {
  const nearStart = "All melee blunt damage is increased by an additional 20%.";
  const deep =
    "When equipped with a Melee weapon, launch a powerful upward strike during the ascent of your jump.";

  const findRange = (text: string, sub: string) => {
    const start = text.indexOf(sub);
    return { start, end: start + sub.length };
  };

  it("starts from the beginning when the match is near the start", () => {
    const s = buildSnippet(nearStart, findRange(nearStart, "melee"));
    expect(s.leadingEllipsis).toBe(false);
    expect(s.before).toBe("All ");
    expect(s.match).toBe("melee");
    expect(s.before + s.match + s.after).toBe(nearStart);
  });

  it("scopes a window around a deep match with a leading ellipsis", () => {
    const text = `Some long preamble that pushes the interesting part far away. ${deep}`;
    const range = findRange(text, "Melee");
    const s = buildSnippet(text, range);
    expect(s.leadingEllipsis).toBe(true);
    expect(s.match).toBe("Melee");
    // Window starts at a word boundary shortly before the match
    expect(s.before.length).toBeLessThanOrEqual(25);
    const windowStart = range.start - s.before.length;
    expect(text.slice(windowStart, range.start)).toBe(s.before);
    expect(text[windowStart - 1]).toBe(" ");
  });

  it("caps the snippet length at a word boundary with trailing ellipsis", () => {
    const long = `${"word ".repeat(50)}end.`;
    const s = buildSnippet(long, findRange(long, "word"));
    const visible = s.before + s.match + s.after;
    expect(visible.length).toBeLessThanOrEqual(SNIPPET_MAX_LENGTH + 1);
    expect(s.after.endsWith("…")).toBe(true);
    expect(visible).not.toContain("end.");
  });

  it("renders the start of the text when there is no match", () => {
    const s = buildSnippet(nearStart);
    expect(s.leadingEllipsis).toBe(false);
    expect(s.match).toBe("");
    expect(s.before).toBe(nearStart);
  });

  it("handles empty text", () => {
    const s = buildSnippet("");
    expect(s.before + s.match + s.after).toBe("");
  });
});
