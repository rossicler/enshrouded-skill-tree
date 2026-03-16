import { Fragment, useMemo } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useTranslation } from "next-i18next";

import { useAppSelector } from "@/redux/hooks";
import {
  getStatsFromFlameAltar,
  getStatsFromSkills,
  sumStats,
} from "@/utils/stats";
import { BasicStats, StatsType } from "@/constants/Stats";
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
  const flameLevel = useAppSelector((state) => state.skill.flameLevel ?? 1);
  const stats = useMemo(
    () =>
      sumStats([
        getStatsFromSkills(skillsSelected),
        getStatsFromFlameAltar(flameLevel),
      ]),
    [skillsSelected, flameLevel]
  );

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-xs transform overflow-visible text-left align-middle transition-all">
                <GamePanel onClose={onClose}>
                  <div className="px-10 py-6">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-[#e8d5a3] drop-shadow-[0_0_4px_rgba(202,152,3,0.4)]"
                    >
                      {t("dialogs.stats.title")}
                    </Dialog.Title>
                    <div className="mt-5 text-[#c0b89a] flex gap-5 w-full">
                      <div className="flex flex-col gap-5 w-full">
                        <h3 className="font-medium text-[#e8d5a3]">
                          {t("dialogs.stats.basic")}
                        </h3>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 w-full text-sm justify-between">
                          {Object.keys(BasicStats).map((stat) => (
                            <div key={stat} className="flex justify-between">
                              <span>{t(STAT_KEYS[stat])}</span>
                              <span className="text-[#e8d5a3]">
                                {stats[stat as StatsType] ?? 0}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="w-full flex justify-end mt-6">
                      <GameButton onClick={onClose}>
                        {t("dialogs.stats.close")}
                      </GameButton>
                    </div>
                  </div>
                </GamePanel>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default StatsDialog;
