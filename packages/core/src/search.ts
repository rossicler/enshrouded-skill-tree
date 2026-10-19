import SkillNodes, { SkillNodesType } from "./constants/Nodes";
import { buildSearchCorpus, type SearchEntry } from "./utils/searchCorpus";
import { buildSnippet, normalizeQuery, scoreMatch, type MatchRange, type Snippet } from "./utils/searchText";

// Shorter queries match nothing: two letters would light up most of the tree.
export const SEARCH_MIN_QUERY_LENGTH = 3;

export type SkillSearchResult = SearchEntry & {
  // Where the query sits in `name`, for highlighting.
  nameMatch?: MatchRange;
  // A one-line excerpt of the description around the match.
  snippet: Snippet;
};

export type SkillSearchOptions = {
  // Only skills whose name is exactly the query (case-insensitive), as a link
  // to one skill (?focus=) needs.
  exact?: boolean;
  // A corpus from buildSearchCorpus(locale, tree). Defaults to the default
  // tree's, built once per locale.
  corpus?: SearchEntry[];
};

const corpusCache = new Map<string, SearchEntry[]>();

// The default tree's search corpus for `locale`, built on first use.
export const getSearchCorpus = (locale: string): SearchEntry[] => {
  let corpus = corpusCache.get(locale);
  if (!corpus) {
    corpus = buildSearchCorpus(locale);
    corpusCache.set(locale, corpus);
  }
  return corpus;
};

// Skill types matching `query` in `locale`, best first: exact name, then a
// name containing the query, then a description containing it; earlier
// matches first, then by name. Accents and case are ignored.
export const searchSkills = (
  query: string,
  locale: string,
  { exact = false, corpus = getSearchCorpus(locale) }: SkillSearchOptions = {}
): SkillSearchResult[] => {
  if (!query || query.length < SEARCH_MIN_QUERY_LENGTH) return [];

  if (exact) {
    const lower = query.toLowerCase();
    return corpus
      .filter((entry) => entry.name.toLowerCase() === lower)
      .map((entry) => ({
        ...entry,
        nameMatch: { start: 0, end: entry.name.length },
        snippet: buildSnippet(entry.description),
      }));
  }

  const queryNorm = normalizeQuery(query, locale);
  if (!queryNorm) return [];

  return corpus
    .map((entry) => ({ entry, score: scoreMatch(entry.nameNorm, entry.descNorm, queryNorm) }))
    .filter(({ score }) => score.weight > 0)
    .sort(
      (a, b) =>
        b.score.weight - a.score.weight ||
        a.score.position - b.score.position ||
        a.entry.name.localeCompare(b.entry.name, locale)
    )
    .map(({ entry, score }) => ({
      ...entry,
      nameMatch: score.nameMatch,
      snippet: buildSnippet(entry.description, score.descMatch),
    }));
};

// IDs of the nodes of a skill type (most types have one node; attribute
// types have many).
export const getNodesOfType = (type: string, tree: SkillNodesType = SkillNodes): string[] =>
  Object.values(tree.nodes)
    .filter((node) => node.type === type)
    .map((node) => node.id);
