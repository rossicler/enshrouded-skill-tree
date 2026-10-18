import { BarChart3 } from "lucide-react";
import { clampFlameLevel } from "@enshrouded/core";
import { StatsButton, useStats, useUiText } from "@enshrouded/react";

import { useAppSelector } from "@/redux/hooks";
import { classNames } from "@/utils/utils";

// The stats button and dialog from @enshrouded/react, fed from Redux. An icon
// on mobile, a label from md up.
const Stats = () => {
  const ui = useUiText();
  const selection = useAppSelector((state) => state.skill.selectedSkills);
  const flameLevel = useAppSelector((state) => clampFlameLevel(state.skill.flameLevel ?? 1));
  const stats = useStats(selection, flameLevel);

  return (
    <div className={classNames("flex flex-col gap-1.5 mt-3 md:mt-5")}>
      <StatsButton stats={stats} className="!min-w-0 !px-4 md:!min-w-[140px] md:!px-8" aria-label={ui("stats.button")}>
        <BarChart3 size={16} className="md:hidden" />
        <span className="hidden md:inline">{ui("stats.button")}</span>
      </StatsButton>
    </div>
  );
};

export default Stats;
