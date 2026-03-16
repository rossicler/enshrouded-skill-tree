import { BasicStats, StatsType } from "@/constants/Stats";
import { useAppSelector } from "@/redux/hooks";
import { getStatsFromSkills } from "@/utils/stats";
import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import { classNames } from "@/utils/utils";
import GameButton from "../shared/GameButton";
import StatsDialog from "../dialogs/StatsDialog";

const Stats = () => {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);

  return (
    <div className={classNames("flex flex-col gap-1.5 mt-3 md:mt-5")}>
      <GameButton onClick={() => setOpen(true)}>{t("hud.stats")}</GameButton>
      <StatsDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
};

export default Stats;
