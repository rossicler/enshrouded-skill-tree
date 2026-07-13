// Pure text utilities for the skill search: locale/accent-insensitive matching
// with index maps back to the original string, weighted scoring, and one-line
// description snippets scoped around the matched substring.

export const SNIPPET_CONTEXT_BEFORE = 25;
export const SNIPPET_NEAR_START = 40;
export const SNIPPET_MAX_LENGTH = 120;

export type NormalizedText = {
  original: string;
  norm: string;
  // map[i] = index in `original` of the character that produced norm[i]
  map: number[];
};

export type MatchRange = { start: number; end: number };

export type ScoreResult = {
  // 3 = exact name, 2 = partial name, 1 = description, 0 = no match
  weight: 0 | 1 | 2 | 3;
  // match position in the normalized name (weights 2-3) or description
  // (weight 1), used as a tie-breaker within a weight class
  position: number;
  nameMatch?: MatchRange;
  descMatch?: MatchRange;
};

export type Snippet = {
  leadingEllipsis: boolean;
  before: string;
  match: string;
  after: string;
};

// Combining Diacritical Marks block; \p{M} needs an ES2018 regex target
const COMBINING_MARKS = /[\u0300-\u036f]/g;

const foldChar = (ch: string, locale?: string): string =>
  ch
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLocaleLowerCase(locale);

export const normalizeForSearch = (
  text: string,
  locale?: string,
): NormalizedText => {
  let norm = "";
  const map: number[] = [];
  let origIndex = 0;
  for (const ch of text) {
    const folded = foldChar(ch, locale);
    for (let i = 0; i < folded.length; i++) {
      map.push(origIndex);
    }
    norm += folded;
    origIndex += ch.length;
  }
  return { original: text, norm, map };
};

export const normalizeQuery = (query: string, locale?: string): string =>
  normalizeForSearch(query.trim(), locale).norm;

// SSR-safe plain-text extraction for the description HTML in nodes.json
// (only <b>/<i>/<br> tags and a handful of entities appear there).
export const stripHtml = (html: string): string =>
  html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

export const mapRangeToOriginal = (
  text: NormalizedText,
  start: number,
  end: number,
): MatchRange => {
  const { original, norm, map } = text;
  const origStart = map[start] ?? original.length;
  let origEnd = end < norm.length ? map[end] : original.length;
  // If `end` falls inside a one-to-many expansion (e.g. ß -> ss), extend the
  // highlight to cover the whole original character.
  if (end > start && end < norm.length && map[end] === map[end - 1]) {
    let j = end;
    while (j < norm.length && map[j] === map[end - 1]) j++;
    origEnd = j < norm.length ? map[j] : original.length;
  }
  return { start: origStart, end: origEnd };
};

export const scoreMatch = (
  name: NormalizedText,
  desc: NormalizedText,
  queryNorm: string,
): ScoreResult => {
  const nameIdx = name.norm.indexOf(queryNorm);
  const descIdx = desc.norm.indexOf(queryNorm);
  if (nameIdx < 0 && descIdx < 0) return { weight: 0, position: 0 };
  const weight = name.norm === queryNorm ? 3 : nameIdx >= 0 ? 2 : 1;
  return {
    weight,
    position: nameIdx >= 0 ? nameIdx : descIdx,
    nameMatch:
      nameIdx >= 0
        ? mapRangeToOriginal(name, nameIdx, nameIdx + queryNorm.length)
        : undefined,
    descMatch:
      descIdx >= 0
        ? mapRangeToOriginal(desc, descIdx, descIdx + queryNorm.length)
        : undefined,
  };
};

// Builds a one-line snippet of `text`. With a match deep in the text, the
// window starts shortly before the match ("…equipped with a Melee weapon…");
// a match near the start keeps the beginning ("All melee blunt damage…").
export const buildSnippet = (text: string, match?: MatchRange): Snippet => {
  const hasMatch = !!match && match.start < match.end && match.start < text.length;

  let windowStart = 0;
  let leadingEllipsis = false;
  if (hasMatch && match.start > SNIPPET_NEAR_START) {
    windowStart = match.start - SNIPPET_CONTEXT_BEFORE;
    // Snap forward to the next word boundary, but never past the match.
    if (text[windowStart - 1] !== " ") {
      const nextSpace = text.indexOf(" ", windowStart);
      if (nextSpace !== -1 && nextSpace < match.start) {
        windowStart = nextSpace + 1;
      }
    }
    leadingEllipsis = true;
  }

  let windowEnd = Math.min(text.length, windowStart + SNIPPET_MAX_LENGTH);
  const truncated = windowEnd < text.length;
  const matchStart = hasMatch ? match.start : windowEnd;
  const matchEnd = hasMatch ? Math.min(match.end, windowEnd) : windowEnd;
  if (truncated) {
    // Snap backward to a word boundary, but never into the match.
    const lastSpace = text.lastIndexOf(" ", windowEnd);
    if (lastSpace > matchEnd) windowEnd = lastSpace;
  }

  return {
    leadingEllipsis,
    before: text.slice(windowStart, Math.min(matchStart, windowEnd)),
    match: text.slice(Math.min(matchStart, windowEnd), matchEnd),
    after: text.slice(matchEnd, windowEnd) + (truncated ? "…" : ""),
  };
};
