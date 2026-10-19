import { useState, type ChangeEvent } from "react";
import { Minus, Plus, SlidersHorizontal } from "lucide-react";
import {
  BIOMES,
  MAX_FLAME_LEVEL,
  MAX_PLAYER_LEVEL,
  computeLevelingPoints,
  computeMaxSkillPoints,
} from "@enshrouded/core";

import { useSkillTreeSettings } from "./SkillTreeProvider";
import { useUiText, type UiTextKey } from "./text";
import { GameButton } from "./kit/GameButton";
import { GameButtonGroup } from "./kit/GameButtonGroup";
import { GameDialog, GameDialogTitle } from "./kit/GameDialog";
import { GamePanel } from "./kit/GamePanel";
import { GameTooltip } from "./kit/GameTooltip";
import { classNames, useAssetUrl } from "./kit/shared";

const ALL_BIOMES = BIOMES.map((biome) => biome.id);
const clampPlayerLevel = (level: number) => Math.max(1, Math.min(MAX_PLAYER_LEVEL, level));

// ---------------------------------------------------------------------------
// Biome budget: the player level and explored biomes behind the point budget.

export type BiomeBudgetDialogProps = {
  open: boolean;
  onClose: () => void;
  playerLevel: number;
  // Explored biome IDs (see BIOMES in @enshrouded/core).
  biomes: string[];
  onPlayerLevelChange: (level: number) => void;
  onBiomesChange: (biomes: string[]) => void;
};

export const BiomeBudgetDialog = ({
  open,
  onClose,
  playerLevel,
  biomes,
  onPlayerLevelChange,
  onBiomesChange,
}: BiomeBudgetDialogProps) => {
  const t = useUiText();
  const { playSound } = useSkillTreeSettings();

  const levelingSP = computeLevelingPoints(playerLevel);
  const maxSP = computeMaxSkillPoints(playerLevel, biomes);
  const isDefault =
    playerLevel === MAX_PLAYER_LEVEL && biomes.length === BIOMES.length && BIOMES.every((b) => biomes.includes(b.id));

  const resetToDefault = () => {
    playSound("node-unlock", 0.4);
    onPlayerLevelChange(MAX_PLAYER_LEVEL);
    onBiomesChange(ALL_BIOMES);
  };

  const toggleBiome = (id: string) => {
    const isChecked = biomes.includes(id);
    playSound(isChecked ? "node-refund" : "node-unlock", 0.4);
    onBiomesChange(isChecked ? biomes.filter((b) => b !== id) : [...biomes, id]);
  };

  const changeLevel = (delta: number) => {
    playSound("node-hover", 0.3);
    onPlayerLevelChange(clampPlayerLevel(playerLevel + delta));
  };

  const handleLevelInput = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) onPlayerLevelChange(clampPlayerLevel(val));
  };

  const stepClasses =
    "w-6 h-6 flex items-center justify-center text-[#c0b89a] hover:text-[#e8d5a3] disabled:opacity-30 transition-colors text-base leading-none";

  return (
    <GameDialog open={open} onClose={onClose} name="biome-budget" className="max-w-sm">
      <GamePanel onClose={onClose}>
        <div className="px-10 py-6">
          <GameDialogTitle>{t("budget.title")}</GameDialogTitle>

          {/* Player level row */}
          <div className="mt-5 flex flex-col gap-1.5">
            <span className="text-sm text-[#c0b89a]">{t("budget.playerLevel")}</span>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => changeLevel(-1)}
                  onMouseEnter={() => playSound("node-hover", 0.3)}
                  disabled={playerLevel <= 1}
                  className={stepClasses}
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={MAX_PLAYER_LEVEL}
                  value={playerLevel}
                  onChange={handleLevelInput}
                  aria-label={t("budget.playerLevel")}
                  data-budget="player-level"
                  className="w-12 text-center bg-transparent border border-[#5a5a60] text-sm text-[#e8d5a3] py-0.5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => changeLevel(1)}
                  onMouseEnter={() => playSound("node-hover", 0.3)}
                  disabled={playerLevel >= MAX_PLAYER_LEVEL}
                  className={stepClasses}
                >
                  +
                </button>
              </div>
              <span className="text-xs tabular-nums text-[#c0b89a]">+{levelingSP}</span>
            </div>
          </div>

          {/* Biome exploration rows */}
          <ul className="mt-4 space-y-1">
            {BIOMES.map((biome) => {
              const checked = biomes.includes(biome.id);
              return (
                <li key={biome.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    data-biome={biome.id}
                    onClick={() => toggleBiome(biome.id)}
                    onMouseEnter={() => playSound("node-hover", 0.3)}
                    className="w-full flex items-center justify-between py-1 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={classNames(
                          "inline-flex w-3.5 h-3.5 rounded-xs border shrink-0 items-center justify-center transition-colors",
                          checked ? "bg-[#C8B169] border-[#C8B169]" : "border-[#5a5a60] group-hover:border-[#C8B169]/50"
                        )}
                      >
                        {checked && (
                          <svg
                            viewBox="0 0 10 8"
                            className="w-2 h-2 text-black"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M1 4l3 3 5-6" />
                          </svg>
                        )}
                      </span>
                      <span className="text-sm text-[#c0b89a]">{t(`biomes.${biome.id}` as UiTextKey)}</span>
                    </div>
                    <span className="text-xs tabular-nums text-[#c0b89a]">+{biome.explorationPoints}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Total */}
          <div className="mt-4 pt-3 border-t border-[#5a5a60]/50 flex justify-between items-center">
            <span className="text-sm text-[#c0b89a]">{t("budget.total")}</span>
            <span className="text-sm font-semibold text-[#e8d5a3] tabular-nums" data-budget="total">
              {maxSP}
            </span>
          </div>

          <div className="flex justify-end mt-3">
            <GameButton variant="text" type="button" onClick={resetToDefault} disabled={isDefault}>
              {t("budget.reset")}
            </GameButton>
          </div>
        </div>
      </GamePanel>
    </GameDialog>
  );
};

// A small sliders button that opens the BiomeBudgetDialog.
export const BiomeBudgetButton = (props: Omit<BiomeBudgetDialogProps, "open" | "onClose">) => {
  const t = useUiText();
  const [open, setOpen] = useState(false);
  return (
    <>
      <BiomeBudgetDialog {...props} open={open} onClose={() => setOpen(false)} />
      <GameButton
        variant="text"
        type="button"
        data-hud="biome-budget"
        onClick={() => setOpen(true)}
        title={t("budget.title")}
        aria-label={t("budget.title")}
      >
        <SlidersHorizontal size={14} />
      </GameButton>
    </>
  );
};

// ---------------------------------------------------------------------------
// Flame level: − / level / + in one button group.

export type FlameLevelControlProps = {
  level: number;
  // Without it the control is read-only.
  onChange?: (level: number) => void;
  // "panel" leaves room for the group's side ornaments (shown from md up).
  layout?: "panel" | "bar";
};

export const FlameLevelControl = ({ level, onChange, layout = "panel" }: FlameLevelControlProps) => {
  const t = useUiText();
  const readOnly = !onChange;
  const edge = layout === "panel" ? ["!pl-8", "!pr-8"] : ["", ""];

  return (
    <div>
      <div className="flex text-xl gap-1.5 items-center">
        <GameButtonGroup>
          <GameButton
            grouped
            type="button"
            className={classNames("!min-w-0 !px-4", edge[0])}
            data-hud="flame-down"
            aria-label={t("points.flameDown")}
            onClick={() => level > 1 && onChange?.(level - 1)}
            disabled={readOnly || level <= 1}
          >
            <Minus size={14} />
          </GameButton>
          <input
            type="number"
            data-hud="flame-level"
            aria-label={t("points.flameLevel")}
            min={1}
            max={MAX_FLAME_LEVEL}
            value={level}
            readOnly={readOnly}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 1 && val <= MAX_FLAME_LEVEL) onChange?.(val);
            }}
            className={classNames(
              "relative z-10 w-10 text-center bg-transparent",
              "px-1 py-2.5 text-sm font-semibold tracking-wide",
              "text-[#e8d5a3] drop-shadow-[0_0_4px_rgba(202,152,3,0.4)]",
              "focus:outline-hidden",
              "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            )}
          />
          <GameButton
            grouped
            type="button"
            className={classNames("!min-w-0 !px-4", edge[1])}
            data-hud="flame-up"
            aria-label={t("points.flameUp")}
            onClick={() => level < MAX_FLAME_LEVEL && onChange?.(level + 1)}
            disabled={readOnly || level >= MAX_FLAME_LEVEL}
          >
            <Plus size={14} />
          </GameButton>
        </GameButtonGroup>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// The points panel: points used / budget, the biome budget, the flame level.

export type PointsPanelProps = {
  pointsUsed: number;
  maxPoints: number;
  // Shows the flame level row. Omit it to leave the row out.
  flameLevel?: number;
  onFlameLevelChange?: (level: number) => void;
  // With both callbacks, a button opens the biome budget dialog.
  playerLevel?: number;
  biomes?: string[];
  onPlayerLevelChange?: (level: number) => void;
  onBiomesChange?: (biomes: string[]) => void;
  // "panel": a two-row grid with hints on the icons (about 260 px wide).
  // "bar": one wrapping row, for a strip along the bottom of a small screen.
  layout?: "panel" | "bar";
  className?: string;
};

export const PointsPanel = ({
  pointsUsed,
  maxPoints,
  flameLevel,
  onFlameLevelChange,
  playerLevel = MAX_PLAYER_LEVEL,
  biomes = ALL_BIOMES,
  onPlayerLevelChange,
  onBiomesChange,
  layout = "panel",
  className,
}: PointsPanelProps) => {
  const t = useUiText();
  const asset = useAssetUrl();
  const bar = layout === "bar";

  const points = (
    <div className={classNames("flex gap-1.5 items-center", bar && "gap-1")}>
      <span
        data-hud="points-used"
        className={classNames(
          "font-semibold tracking-wide",
          "text-[#e8d5a3] drop-shadow-[0_0_4px_rgba(202,152,3,0.4)]",
          pointsUsed >= maxPoints && "!text-[#ef4444]"
        )}
      >
        {pointsUsed}
      </span>
      <span data-hud="points-max" className="font-semibold tracking-wide text-[#e8d5a3]/60">
        / {maxPoints}
      </span>
    </div>
  );
  const budget =
    onPlayerLevelChange && onBiomesChange ? (
      <BiomeBudgetButton
        playerLevel={playerLevel}
        biomes={biomes}
        onPlayerLevelChange={onPlayerLevelChange}
        onBiomesChange={onBiomesChange}
      />
    ) : null;
  const pointIcon = (size: number) => (
    <img src={asset("ui/skill_point_hud.png")} alt={t("points.skillPointIcon")} width={size} height={size} />
  );
  const flameIcon = (size: number) => (
    <img src={asset("ui/flame.png")} alt={t("points.flameIcon")} width={size} height={size} />
  );
  const hasFlame = flameLevel !== undefined;

  if (bar) {
    return (
      <GamePanel className={className}>
        <div className="px-4 py-2 flex items-center justify-between flex-wrap gap-y-1" data-points-panel="bar">
          <div className="flex items-center gap-2">
            {pointIcon(24)}
            <div className="flex text-base gap-1 items-center justify-between w-full">
              {points}
              {budget}
            </div>
          </div>
          {hasFlame && (
            <div className="flex items-center gap-2">
              {flameIcon(30)}
              <FlameLevelControl level={flameLevel} onChange={onFlameLevelChange} layout="bar" />
            </div>
          )}
        </div>
      </GamePanel>
    );
  }

  return (
    <GamePanel className={className}>
      <div className="px-4 py-3 grid grid-cols-[45px_1fr] gap-x-2 gap-y-3 items-center" data-points-panel="panel">
        <GameTooltip text={t("points.skillPoints")} position="bottom" className="flex justify-center">
          {pointIcon(30)}
        </GameTooltip>
        <div className="flex text-lg gap-1.5 items-center justify-between">
          {points}
          {budget}
        </div>
        {hasFlame && (
          <>
            <GameTooltip text={t("points.flameLevel")} position="bottom" className="flex justify-center">
              {flameIcon(45)}
            </GameTooltip>
            <FlameLevelControl level={flameLevel} onChange={onFlameLevelChange} layout="panel" />
          </>
        )}
      </div>
    </GamePanel>
  );
};
