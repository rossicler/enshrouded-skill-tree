import { BarChart3 } from "lucide-react";
import { clampFlameLevel } from "@enshrouded/core";
import { StatsToggle, useStats, useUiText } from "@enshrouded/react";

import { useAppSelector } from "@/redux/hooks";
import { classNames } from "@/utils/utils";
import { HUD_TOGGLE_BUTTON_CLASSES } from "./hudToggleButton";

// The stats button and its panel from @enshrouded/react, fed from Redux. A click
// opens the panel below the button, a second click closes it. An icon on
// mobile, a label from md up.
type StatsProps = {
  // Controlled by the HUD, which keeps only one panel open at a time.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // The panel's maximum height class (see HudToggle).
  panelSizeClassName?: string;
};

const Stats = ({ open, onOpenChange, panelSizeClassName }: StatsProps) => {
  const ui = useUiText();
  const selection = useAppSelector((state) => state.skill.selectedSkills);
  const flameLevel = useAppSelector((state) => clampFlameLevel(state.skill.flameLevel ?? 1));
  const stats = useStats(selection, flameLevel);

  return (
    <StatsToggle
      stats={stats}
      open={open}
      onOpenChange={onOpenChange}
      panelSizeClassName={panelSizeClassName}
      className={classNames("mt-3 md:mt-5")}
      buttonClassName={HUD_TOGGLE_BUTTON_CLASSES}
      aria-label={ui("stats.button")}
    >
      <BarChart3 size={16} className="md:hidden" />
      <span className="hidden md:inline whitespace-nowrap">{ui("stats.button")}</span>
    </StatsToggle>
  );
};

export default Stats;
