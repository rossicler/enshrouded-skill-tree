import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { SlidersHorizontal } from "lucide-react";
import { useTranslation } from "next-i18next";
import {
  BIOMES,
  MAX_PLAYER_LEVEL,
  computeLevelingPoints,
  computeMaxSkillPoints,
} from "@/constants/Biomes";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setUnlockedBiomes, setPlayerLevel } from "@/redux/skills/skills.slice";
import { classNames } from "@/utils/utils";
import { playSound } from "@/utils/sounds";
import GamePanel from "../shared/GamePanel";
import GameButton from "../shared/GameButton";

type PropsType = {
  open: boolean;
  onClose: () => void;
};

const BiomeBudgetDialog = ({ open, onClose }: PropsType) => {
  const { t } = useTranslation("common");
  const dispatch = useAppDispatch();
  const unlockedBiomes = useAppSelector(
    (state) => state.skill.unlockedBiomes ?? BIOMES.map((b) => b.id)
  );
  const playerLevel = useAppSelector((state) => state.skill.playerLevel ?? MAX_PLAYER_LEVEL);

  const levelingSP = computeLevelingPoints(playerLevel);
  const maxSP = computeMaxSkillPoints(playerLevel, unlockedBiomes);

  const toggleBiome = (id: string) => {
    const isChecked = unlockedBiomes.includes(id);
    playSound(isChecked ? "node-refund" : "node-unlock", 0.4);
    const next = isChecked
      ? unlockedBiomes.filter((b) => b !== id)
      : [...unlockedBiomes, id];
    dispatch(setUnlockedBiomes(next));
  };

  const changeLevel = (delta: number) => {
    playSound("node-hover", 0.3);
    dispatch(setPlayerLevel(playerLevel + delta));
  };

  const handleLevelInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) dispatch(setPlayerLevel(val));
  };

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
              <Dialog.Panel className="w-full max-w-sm transform overflow-visible text-left align-middle transition-all">
                <GamePanel onClose={onClose}>
                  <div className="px-10 py-6">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-[#e8d5a3] drop-shadow-[0_0_4px_rgba(202,152,3,0.4)]"
                    >
                      {t("hud.biomeBudget.title")}
                    </Dialog.Title>

                    {/* Player level row */}
                    <div className="mt-5 flex flex-col gap-1.5">
                      <span className="text-sm text-[#c0b89a]">{t("hud.biomeBudget.playerLevel")}</span>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => changeLevel(-1)}
                            onMouseEnter={() => playSound("node-hover", 0.3)}
                            disabled={playerLevel <= 1}
                            className="w-6 h-6 flex items-center justify-center text-[#c0b89a] hover:text-[#e8d5a3] disabled:opacity-30 transition-colors text-base leading-none"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={MAX_PLAYER_LEVEL}
                            value={playerLevel}
                            onChange={handleLevelInput}
                            className="w-12 text-center bg-transparent border border-[#5a5a60] text-sm text-[#e8d5a3] py-0.5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                          <button
                            onClick={() => changeLevel(1)}
                            onMouseEnter={() => playSound("node-hover", 0.3)}
                            disabled={playerLevel >= MAX_PLAYER_LEVEL}
                            className="w-6 h-6 flex items-center justify-center text-[#c0b89a] hover:text-[#e8d5a3] disabled:opacity-30 transition-colors text-base leading-none"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-xs tabular-nums text-[#c0b89a]">
                          +{levelingSP}
                        </span>
                      </div>
                    </div>

                    {/* Biome exploration rows */}
                    <ul className="mt-4 space-y-1">
                      {BIOMES.map((biome) => {
                        const checked = unlockedBiomes.includes(biome.id);
                        return (
                          <li key={biome.id}>
                            <button
                              onClick={() => toggleBiome(biome.id)}
                              onMouseEnter={() => playSound("node-hover", 0.3)}
                              className="w-full flex items-center justify-between py-1 group"
                            >
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={classNames(
                                    "inline-flex w-3.5 h-3.5 rounded-sm border shrink-0 items-center justify-center transition-colors",
                                    checked
                                      ? "bg-[#C8B169] border-[#C8B169]"
                                      : "border-[#5a5a60] group-hover:border-[#C8B169]/50"
                                  )}
                                >
                                  {checked && (
                                    <svg viewBox="0 0 10 8" className="w-2 h-2 text-black" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M1 4l3 3 5-6" />
                                    </svg>
                                  )}
                                </span>
                                <span className="text-sm text-[#c0b89a]">
                                  {t(`biomes.${biome.id}`)}
                                </span>
                              </div>
                              <span className="text-xs tabular-nums text-[#c0b89a]">
                                +{biome.explorationPoints}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>

                    {/* Total */}
                    <div className="mt-4 pt-3 border-t border-[#5a5a60]/50 flex justify-between items-center">
                      <span className="text-sm text-[#c0b89a]">{t("hud.biomeBudget.total")}</span>
                      <span className="text-sm font-semibold text-[#e8d5a3] tabular-nums">{maxSP}</span>
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

export { BiomeBudgetDialog };

const BiomeBudget = () => {
  const { t } = useTranslation("common");
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <BiomeBudgetDialog open={open} onClose={() => setOpen(false)} />
      <GameButton
        variant="text"
        onClick={() => setOpen(true)}
        title={t("hud.biomeBudget.title")}
      >
        <SlidersHorizontal size={14} />
      </GameButton>
    </>
  );
};

export default BiomeBudget;
