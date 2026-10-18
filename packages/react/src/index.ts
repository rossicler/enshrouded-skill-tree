"use client";

// @enshrouded/react: React components for the Enshrouded skill tree, built on
// @enshrouded/core. Client components only. Styling is Tailwind 4: import
// theme.css and add this package's src/ as a @source. Serve the assets/
// folder (scripts/sync-assets.mjs) and pass its URL as `assetBaseUrl`.

export { SkillTreeProvider, DEFAULT_ASSET_BASE_URL, useSkillTreeSettings } from "./SkillTreeProvider";
export type { SkillTreeProviderProps, SkillTreeNotice, SkillTreeSound, SkillTreeSettings } from "./SkillTreeProvider";
export { SkillTreeView } from "./SkillTreeView";
export type { SkillTreeViewProps, SkillTreeViewHandle, RefundRequest } from "./SkillTreeView";
export { SkillTreeCard, DEFAULT_CARD_SIZE } from "./SkillTreeCard";
export type { SkillTreeCardProps, SkillTreeCardHandle, SkillTreeCardMode } from "./SkillTreeCard";
export { useSkillBuild } from "./useSkillBuild";
export { getNodeArt, assetUrl } from "./art";
export type { NodeArt, NodeState } from "./art";
export { uiText, uiTextResources } from "./text";
export type { UiTextKey } from "./text";
