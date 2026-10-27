import { useCallback, useMemo, useState } from "react";
import { BIOMES, MAX_PLAYER_LEVEL, clampFlameLevel } from "@enshrouded/core";
import { PointsPanel, usePoints } from "@enshrouded/react";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  setBonusPoints,
  setFlameLevel,
  setHighlightedStats,
  setPlayerLevel,
  setUnlockedBiomes,
} from "@/redux/skills/skills.slice";
import { classNames } from "@/utils/utils";
import Highlight from "./Highlight";
import { DESKTOP_PANEL_SIZE_CLASSES } from "./hudToggleButton";
import Stats from "./Stats";

const ALL_BIOMES = BIOMES.map((b) => b.id);
const NO_STATS: string[] = [];

// The HUD panels that open below their buttons. On mobile only one is open at
// a time, so two tall panels never stack past the bottom of a short screen. On
// desktop each opens and closes on its own, and both can stay open together.
type HudPanel = "stats" | "highlight";

// The planner's points HUD: @enshrouded/react's points panel fed from Redux.
// Desktop: a panel top-left with the stats and highlight buttons below it.
// Mobile: a bar along the bottom, and the two buttons top-left.
const PointsHUD = () => {
  const dispatch = useAppDispatch();
  const selection = useAppSelector((state) => state.skill.selectedSkills);
  const biomes = useAppSelector((state) => state.skill.unlockedBiomes ?? ALL_BIOMES);
  const playerLevel = useAppSelector((state) => state.skill.playerLevel ?? MAX_PLAYER_LEVEL);
  const flameLevel = useAppSelector((state) => clampFlameLevel(state.skill.flameLevel ?? 1));
  const bonusPoints = useAppSelector((state) => state.skill.bonusPoints ?? 0);
  const highlightedStats = useAppSelector((state) => state.skill.highlightedStats ?? NO_STATS);
  const points = usePoints(selection, { playerLevel, biomes, bonusPoints });

  const onFlameLevelChange = useCallback((level: number) => dispatch(setFlameLevel(level)), [dispatch]);
  const onPlayerLevelChange = useCallback((level: number) => dispatch(setPlayerLevel(level)), [dispatch]);
  const onBiomesChange = useCallback((next: string[]) => dispatch(setUnlockedBiomes(next)), [dispatch]);
  const onBonusPointsChange = useCallback((next: number) => dispatch(setBonusPoints(next)), [dispatch]);
  const onHighlightedStatsChange = useCallback((next: string[]) => dispatch(setHighlightedStats(next)), [dispatch]);
  // Mobile: open / onOpenChange per panel; opening one closes the other.
  const [mobilePanel, setMobilePanel] = useState<HudPanel | null>(null);
  const mobileControl = useMemo(() => {
    const control = (panel: HudPanel) => ({
      open: mobilePanel === panel,
      onOpenChange: (open: boolean) => setMobilePanel((current) => (open ? panel : current === panel ? null : current)),
    });
    return { stats: control("stats"), highlight: control("highlight") };
  }, [mobilePanel]);

  // Desktop: each panel keeps its own state.
  const [desktopOpen, setDesktopOpen] = useState<Record<HudPanel, boolean>>({ stats: false, highlight: false });
  const desktopControl = useMemo(() => {
    const control = (panel: HudPanel) => ({
      open: desktopOpen[panel],
      onOpenChange: (open: boolean) => setDesktopOpen((current) => ({ ...current, [panel]: open })),
      panelSizeClassName: DESKTOP_PANEL_SIZE_CLASSES,
    });
    return { stats: control("stats"), highlight: control("highlight") };
  }, [desktopOpen]);

  const panelProps = {
    pointsUsed: points.used,
    maxPoints: points.max,
    flameLevel,
    onFlameLevelChange,
    playerLevel,
    biomes,
    onPlayerLevelChange,
    onBiomesChange,
    bonusPoints,
    onBonusPointsChange,
  };

  return (
    <>
      {/* Mobile: Stats button top-left */}
      <div className={classNames("absolute left-0 top-[44px] max-[380px]:top-7 z-40", "py-6 px-6 max-[380px]:px-2", "md:hidden")}>
        <Stats {...mobileControl.stats} />
        <Highlight value={highlightedStats} onChange={onHighlightedStatsChange} {...mobileControl.highlight} className="mt-3" />
      </div>

      {/* Mobile: full-width bottom bar, pushed down to hide bottom border */}
      <div className={classNames("absolute bottom-0 left-0 right-0 z-40 pb-[-4px]", "md:hidden")} style={{ bottom: "-4px" }}>
        <PointsPanel {...panelProps} layout="bar" />
      </div>

      {/* Desktop: top-left panel */}
      <div className={classNames("absolute left-0 z-40", "py-6 px-6 flex-col gap-3", "top-0 hidden md:flex")}>
        <PointsPanel {...panelProps} layout="panel" />
        <Stats {...desktopControl.stats} />
        <Highlight value={highlightedStats} onChange={onHighlightedStatsChange} {...desktopControl.highlight} />
      </div>
    </>
  );
};

export default PointsHUD;
