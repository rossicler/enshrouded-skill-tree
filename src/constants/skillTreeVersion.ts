import imported from "./gameSkillData.json";

export const SKILL_TREE_CONTENT_HASH = imported.treeVersion.contentHash;
export const SKILL_TREE_REVISION = SKILL_TREE_CONTENT_HASH.slice(0, 8);

const [gameBuild, branch] = imported.provenance.gameBuild.split("|");
const update = branch.match(/(?:^|_)update_(\d+)(?:\D|$)/)?.[1];

export const SKILL_TREE_GAME_BUILD = gameBuild;
export const SKILL_TREE_UPDATE = update ? String(Number(update)) : undefined;

export const isDifferentTreeVersion = (build: { treeContentHash?: string }) =>
  Boolean(build.treeContentHash && build.treeContentHash !== SKILL_TREE_CONTENT_HASH);
