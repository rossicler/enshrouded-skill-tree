import { useCallback } from "react";
import { BIOMES, MAX_PLAYER_LEVEL, clampFlameLevel } from "@enshrouded/core";
import { PointsPanel, usePoints } from "@enshrouded/react";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setFlameLevel, setPlayerLevel, setUnlockedBiomes } from "@/redux/skills/skills.slice";
import { classNames } from "@/utils/utils";
import Stats from "./Stats";

const ALL_BIOMES = BIOMES.map((b) => b.id);

// The planner's points HUD: @enshrouded/react's points panel fed from Redux.
// Desktop: a panel top-left with the stats button below it. Mobile: a bar
// along the bottom, and the stats button top-left.
const PointsHUD = () => {
  const dispatch = useAppDispatch();
  const selection = useAppSelector((state) => state.skill.selectedSkills);
  const biomes = useAppSelector((state) => state.skill.unlockedBiomes ?? ALL_BIOMES);
  const playerLevel = useAppSelector((state) => state.skill.playerLevel ?? MAX_PLAYER_LEVEL);
  const flameLevel = useAppSelector((state) => clampFlameLevel(state.skill.flameLevel ?? 1));
  const points = usePoints(selection, { playerLevel, biomes });

  const onFlameLevelChange = useCallback((level: number) => dispatch(setFlameLevel(level)), [dispatch]);
  const onPlayerLevelChange = useCallback((level: number) => dispatch(setPlayerLevel(level)), [dispatch]);
  const onBiomesChange = useCallback((next: string[]) => dispatch(setUnlockedBiomes(next)), [dispatch]);
  const panelProps = {
    pointsUsed: points.used,
    maxPoints: points.max,
    flameLevel,
    onFlameLevelChange,
    playerLevel,
    biomes,
    onPlayerLevelChange,
    onBiomesChange,
  };

  return (
    <>
      {/* Mobile: Stats button top-left */}
      <div className={classNames("absolute left-0 top-[44px] max-[380px]:top-7 z-40", "py-6 px-6 max-[380px]:px-2", "md:hidden")}>
        <Stats />
      </div>

      {/* Mobile: full-width bottom bar, pushed down to hide bottom border */}
      <div className={classNames("absolute bottom-0 left-0 right-0 z-40 pb-[-4px]", "md:hidden")} style={{ bottom: "-4px" }}>
        <PointsPanel {...panelProps} layout="bar" />
      </div>

      {/* Desktop: top-left panel */}
      <div className={classNames("absolute left-0 z-40", "py-6 px-6 flex-col gap-3", "top-0 hidden md:flex")}>
        <PointsPanel {...panelProps} layout="panel" />
        <Stats />
      </div>
    </>
  );
};

export default PointsHUD;
