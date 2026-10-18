import { useMemo } from "react";
import { DialogTitle } from "@headlessui/react";
import GameDialog from "../shared/GameDialog";
import { useTranslation } from "next-i18next/pages";

import { useAppSelector } from "@/redux/hooks";
import {
  BasicStats,
  StatsType,
  clampFlameLevel,
  getStatsFromFlameAltar,
  getStatsFromSkills,
  sumStats,
} from "@enshrouded/core";
import GamePanel from "../shared/GamePanel";
import GameButton from "../shared/GameButton";

type PropsType = {
  open: boolean;
  onClose: () => void;
};

const STAT_KEYS: Record<string, string> = {
  CONS: "stats.constitution",
  STR: "stats.strength",
  ENDURANCE: "stats.endurance",
  DEX: "stats.dexterity",
  SPIRIT: "stats.spirit",
  INT: "stats.intelligence",
};

const StatsDialog = ({ open, onClose }: PropsType) => {
  const { t } = useTranslation("common");
  const skillsSelected = useAppSelector((state) => state.skill.selectedSkills);
  const flameLevel = useAppSelector((state) => clampFlameLevel(state.skill.flameLevel ?? 1));
  const stats = useMemo(
    () =>
      sumStats([
        getStatsFromSkills(skillsSelected),
        getStatsFromFlameAltar(flameLevel),
      ]),
    [skillsSelected, flameLevel]
  );

  return (
    <GameDialog open={open} onClose={onClose} name="stats" className="max-w-xs">
      <GamePanel onClose={onClose}>
        <div className="px-10 py-6">
          <DialogTitle
            as="h3"
            className="text-lg font-semibold leading-6 text-[#e8d5a3] drop-shadow-[0_0_4px_rgba(202,152,3,0.4)]"
          >
            {t("dialogs.stats.title")}
          </DialogTitle>
          <div className="mt-5 text-[#c0b89a] flex gap-5 w-full">
            <div className="flex flex-col gap-5 w-full">
              <h3 className="font-medium text-[#e8d5a3]">
                {t("dialogs.stats.basic")}
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 w-full text-sm justify-between">
                {Object.keys(BasicStats).map((stat) => (
                  <div key={stat} className="flex justify-between">
                    <span>{t(STAT_KEYS[stat])}</span>
                    <span className="text-[#e8d5a3]" data-stat={stat}>
                      {stats[stat as StatsType] ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="w-full flex justify-end mt-6">
            <GameButton variant="text" onClick={onClose}>
              {t("dialogs.stats.close")}
            </GameButton>
          </div>
        </div>
      </GamePanel>
    </GameDialog>
  );
};

export default StatsDialog;
