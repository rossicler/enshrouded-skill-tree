// @enshrouded/core: the Enshrouded skill tree as plain TypeScript. Tree data
// and positions, unlock and refund rules, build codes, points, stats, skill
// text and search. No React and no browser globals, so it runs on a server,
// in a browser or in plain Node.

// Tree data and presentation
export {
  default as SkillNodes,
  buildSkillTree,
  getMaxLevel,
  RETIRED_NODES,
  LinesAngles,
} from "./constants/Nodes";
export type {
  ImportedTree,
  Node,
  NodeTypeMetadata,
  GameValues,
  SkillNodesType,
  AuthoredPresentation,
  AuthoredTypePresentation,
  NodePresentation,
} from "./constants/Nodes";
export { default as authoredPresentation } from "./constants/LegacyNodes";
export {
  SKILL_TREE_CONTENT_HASH,
  SKILL_TREE_REVISION,
  SKILL_TREE_GAME_BUILD,
  SKILL_TREE_UPDATE,
  isDifferentTreeVersion,
} from "./constants/skillTreeVersion";
export { TREE_LABELS } from "./constants/TreeLabels";
export type { TreeLabel } from "./constants/TreeLabels";

// Positions and links
export { resolveNodePosition, resolveBaseAnchor } from "./utils/nodePosition";
export type { NodePosition, PositionedNode } from "./utils/nodePosition";
export { getLinesToDraw, getBaseLinesToDraw } from "./links";
export type { LineToDrawType } from "./links";

// Selection rules
export {
  getSelectableSkills,
  getSelectedNeighbors,
  getSkillsToRemove,
  getSubGraphNodes,
  sanitizeSelection,
  hasSelectionChanges,
} from "./selection";
export type { SkillSelection, SelectionCleanup } from "./selection";
export { applySkillAction, removeSkills } from "./actions";
export type { SkillAction, SkillActionOptions, SkillActionResult, SkillChange } from "./actions";

// Build codes
export {
  encodeSkillBuild,
  decodeSkillBuild,
  parseSkillBuild,
  selectionToBuild,
  buildToSelection,
  InvalidSkillBuildError,
} from "./build";
export type { SkillBuild, BuildData } from "./build";

// Points and budget
export {
  BIOMES,
  SP_PER_LEVEL,
  MAX_PLAYER_LEVEL,
  MAX_SKILL_POINTS_ABSOLUTE,
  computeLevelingPoints,
  computeMaxSkillPoints,
} from "./constants/Biomes";
export type { Biome } from "./constants/Biomes";
export { getSkillCost, getPointsUsed, getMaxSkillPoints, fitsUnderHardCap } from "./points";
export type { PointsBudget } from "./points";

// Stats
export { BasicStats } from "./constants/Stats";
export type { StatsType, NodeStatsType } from "./constants/Stats";
export { getStatsFromSkills, getStatsFromFlameAltar, sumStats } from "./utils/stats";

// Skill text
export {
  SKILL_TEXT_LOCALES,
  DEFAULT_SKILL_TEXT_LOCALE,
  skillTextResources,
  getSkillName,
  getSkillDescription,
  getSkillPerLevelLabel,
  getSkillText,
  getNodeName,
  getTreeLabelName,
} from "./text";
export type { SkillText, SkillTextLocale } from "./text";
export { baseLanguage, usesGameText, skillTextPrefix } from "./utils/skillText";
export {
  getSkillInterpolationValues,
  getGameInterpolationValues,
  getGamePerLevelValues,
} from "./utils/skillInterpolation";
export { humanizeKey } from "./utils/humanizeKey";

// Search
export { buildSearchCorpus } from "./utils/searchCorpus";
export type { SearchEntry } from "./utils/searchCorpus";
export {
  SNIPPET_CONTEXT_BEFORE,
  SNIPPET_NEAR_START,
  SNIPPET_MAX_LENGTH,
  normalizeForSearch,
  normalizeQuery,
  stripHtml,
  mapRangeToOriginal,
  scoreMatch,
  buildSnippet,
} from "./utils/searchText";
export type { NormalizedText, MatchRange, ScoreResult, Snippet } from "./utils/searchText";
