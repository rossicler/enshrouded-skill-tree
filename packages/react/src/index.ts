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
export { uiText, uiTextResources, useUiText } from "./text";
export type { UiTextKey } from "./text";

// Points, stats and search: hooks over @enshrouded/core, and ready-made pieces.
export { usePoints, useStats, useSkillSearch } from "./hooks";
export type { SkillSearchState } from "./hooks";
export { PointsPanel, FlameLevelControl, BiomeBudgetButton, BiomeBudgetDialog } from "./PointsPanel";
export type { PointsPanelProps, FlameLevelControlProps, BiomeBudgetDialogProps } from "./PointsPanel";
export { StatsList, StatsDialog, StatsButton, StatsToggle } from "./StatsPanel";
export type { StatsListProps, StatsDialogProps, StatsButtonProps, StatsToggleProps } from "./StatsPanel";
export { StatHighlightList, StatHighlightPanel, StatHighlightButton, getStatMarkers, STAT_HIGHLIGHT_COLORS } from "./StatHighlight";
export { HudToggle, useControllableOpen } from "./kit/HudToggle";
export type { HudToggleProps } from "./kit/HudToggle";
export type { StatHighlightPanelProps, StatHighlightButtonProps } from "./StatHighlight";
export { SkillSearch } from "./SkillSearch";
export type { SkillSearchProps } from "./SkillSearch";

// The game-styled UI kit.
export { GameButton } from "./kit/GameButton";
export type { GameButtonProps } from "./kit/GameButton";
export { GameButtonGroup } from "./kit/GameButtonGroup";
export type { GameButtonGroupProps } from "./kit/GameButtonGroup";
export { GamePanel } from "./kit/GamePanel";
export type { GamePanelProps } from "./kit/GamePanel";
export { GameInput } from "./kit/GameInput";
export type { GameInputProps } from "./kit/GameInput";
export { GameTooltip } from "./kit/GameTooltip";
export type { GameTooltipProps } from "./kit/GameTooltip";
export { CopyInput } from "./kit/CopyInput";
export type { CopyInputProps } from "./kit/CopyInput";
export { GameDialog, GameDialogTitle } from "./kit/GameDialog";
export type { GameDialogProps } from "./kit/GameDialog";
export { classNames } from "./kit/shared";
