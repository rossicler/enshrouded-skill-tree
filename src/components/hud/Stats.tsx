import { BasicStats, StatsType } from "@/constants/Stats";
import { useAppSelector } from "@/redux/hooks";
import { getStatsFromSkills } from "@/utils/stats";
import React, { useState } from "react";
import { classNames } from "@/utils/utils";
import HUDButton from "../shared/HUDButton";
import StatsDialog from "../dialogs/StatsDialog";

const Stats = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className={classNames("flex flex-col gap-1.5 mt-1 md:mt-5")}>
      <HUDButton onClick={() => setOpen(true)}>Stats</HUDButton>
      <StatsDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
};

export default Stats;
