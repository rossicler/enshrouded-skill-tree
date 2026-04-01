import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import { BarChart3 } from "lucide-react";
import { classNames } from "@/utils/utils";
import GameButton from "../shared/GameButton";
import StatsDialog from "../dialogs/StatsDialog";

const Stats = () => {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);

  return (
    <div className={classNames("flex flex-col gap-1.5 mt-3 md:mt-5")}>
      <GameButton className="!min-w-0 !px-4 md:!min-w-[140px] md:!px-8" onClick={() => setOpen(true)}>
        <BarChart3 size={16} className="md:hidden" />
        <span className="hidden md:inline">{t("hud.stats")}</span>
      </GameButton>
      <StatsDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
};

export default Stats;
