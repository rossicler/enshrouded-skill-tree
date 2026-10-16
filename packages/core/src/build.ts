// The skill build and its share code. The code format is stable: codes made by
// any host load in any other, and old codes keep loading. Never change how a
// code is written; add optional fields instead.
import { SKILL_TREE_CONTENT_HASH } from "./constants/skillTreeVersion";
import type { SkillSelection } from "./selection";

export type SkillBuild = {
  // Selected skill IDs, in selection order.
  skills: string[];
  // Content hash of the tree the build was made on (see skillTreeVersion).
  treeContentHash?: string;
  // Levels above 1. Written only when some skill is above level 1.
  skillLevels?: { [id: string]: number };
  playerLevel?: number;
  unlockedBiomes?: string[];
};

/** @deprecated Use SkillBuild. */
export type BuildData = SkillBuild;

export class InvalidSkillBuildError extends Error {
  constructor(message = "Invalid skill build") {
    super(message);
    this.name = "InvalidSkillBuildError";
  }
}

// A selection as a build. Key order is part of the code format.
export const selectionToBuild = (
  selection: SkillSelection,
  options: { playerLevel?: number; unlockedBiomes?: string[]; treeContentHash?: string } = {}
): SkillBuild => {
  const hasMultiLevel = Object.values(selection).some((level) => level > 1);
  return {
    skills: Object.keys(selection),
    treeContentHash: options.treeContentHash ?? SKILL_TREE_CONTENT_HASH,
    ...(hasMultiLevel ? { skillLevels: selection } : {}),
    ...(options.playerLevel !== undefined ? { playerLevel: options.playerLevel } : {}),
    ...(options.unlockedBiomes !== undefined ? { unlockedBiomes: options.unlockedBiomes } : {}),
  };
};

// The selection a build describes, before it is fitted to the current tree
// (see sanitizeSelection).
export const buildToSelection = (build: SkillBuild): SkillSelection => {
  const out: SkillSelection = {};
  build.skills.forEach((id) => {
    out[id] = 1;
  });
  if (build.skillLevels) {
    Object.entries(build.skillLevels).forEach(([id, lvl]) => {
      if (out[id] != null) out[id] = Math.max(1, Math.floor(lvl));
    });
  }
  return out;
};

// A parsed build from a code or a JSON file. The first format was a plain
// string[] of skill IDs. Returns null for anything else.
export const parseSkillBuild = (value: unknown): SkillBuild | null => {
  if (Array.isArray(value)) {
    return value.every((id) => typeof id === "string") ? { skills: value } : null;
  }
  if (value && typeof value === "object" && Array.isArray((value as SkillBuild).skills)) {
    return value as SkillBuild;
  }
  return null;
};

// base64 of the build's JSON (btoa of JSON.stringify).
export const encodeSkillBuild = (build: SkillBuild): string => btoa(JSON.stringify(build));

// Throws InvalidSkillBuildError for anything that is not a build code.
export const decodeSkillBuild = (code: string): SkillBuild => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(atob(code));
  } catch {
    throw new InvalidSkillBuildError("Invalid skill build code");
  }
  // Codes were never checked beyond this, so an array of non-strings still
  // decodes as a legacy build (its unknown IDs are dropped by sanitizeSelection).
  if (Array.isArray(parsed)) return { skills: parsed };
  const build = parseSkillBuild(parsed);
  if (!build) throw new InvalidSkillBuildError("Invalid skill build code");
  return build;
};
