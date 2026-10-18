import { MAX_FLAME_LEVEL, clampFlameLevel } from "@enshrouded/core";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setFlameLevel } from "@/redux/skills/skills.slice";
import { classNames } from "@/utils/utils";
import React from "react";
import { Minus, Plus } from "lucide-react";
import GameButton from "../shared/GameButton";
import GameButtonGroup from "../shared/GameButtonGroup";

const FlameLevel = () => {
  const level = useAppSelector((state) => clampFlameLevel(state.skill.flameLevel ?? 1));
  const dispatch = useAppDispatch();
  const setLevel = (value: number) => dispatch(setFlameLevel(value));

  const increaseLevel = () => {
    if (level < MAX_FLAME_LEVEL) {
      setLevel(level + 1);
    }
  };

  const decreaseLevel = () => {
    if (level > 1) {
      setLevel(level - 1);
    }
  };

  return (
    <div>
      <div className={classNames("flex text-xl gap-1.5 items-center")}>
        <GameButtonGroup>
          <GameButton grouped className="!min-w-0 !px-4 md:!pl-8" data-hud="flame-down" onClick={decreaseLevel} disabled={level <= 1}>
            <Minus size={14} />
          </GameButton>
          <input
            type="number"
            data-hud="flame-level"
            min={1}
            max={MAX_FLAME_LEVEL}
            value={level}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 1 && val <= MAX_FLAME_LEVEL) {
                setLevel(val);
              }
            }}
            className={classNames(
              "relative z-10 w-10 text-center bg-transparent",
              "px-1 py-2.5 text-sm font-semibold tracking-wide",
              "text-[#e8d5a3] drop-shadow-[0_0_4px_rgba(202,152,3,0.4)]",
              "focus:outline-hidden",
              "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            )}
          />
          <GameButton grouped className="!min-w-0 !px-4 md:!pr-8" data-hud="flame-up" onClick={increaseLevel} disabled={level >= MAX_FLAME_LEVEL}>
            <Plus size={14} />
          </GameButton>
        </GameButtonGroup>
      </div>
    </div>
  );
};

export default FlameLevel;
