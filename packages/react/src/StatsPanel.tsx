import { useState, type ReactNode } from "react";
import { BasicStats, type StatTotals, type StatsType } from "@enshrouded/core";

import { useUiText } from "./text";
import { GameButton, type GameButtonProps } from "./kit/GameButton";
import { GameDialog, GameDialogTitle } from "./kit/GameDialog";
import { GamePanel } from "./kit/GamePanel";
import { classNames } from "./kit/shared";

// Label keys per stat (string literals, so the translation check sees them).
const STAT_KEYS = {
  CONS: "stats.names.constitution",
  STR: "stats.names.strength",
  ENDURANCE: "stats.names.endurance",
  DEX: "stats.names.dexterity",
  SPIRIT: "stats.names.spirit",
  INT: "stats.names.intelligence",
} as const satisfies Record<StatsType, string>;

const STATS = Object.keys(BasicStats) as StatsType[];

export type StatsListProps = {
  // From useStats (or getTotalStats in @enshrouded/core).
  stats: Partial<StatTotals>;
  className?: string;
};

// The attribute totals in two columns. Each value carries data-stat="<STAT>".
export const StatsList = ({ stats, className }: StatsListProps) => {
  const t = useUiText();
  return (
    <div className={classNames("grid grid-cols-2 gap-x-6 gap-y-1 w-full text-sm justify-between", className)}>
      {STATS.map((stat) => (
        <div key={stat} className="flex justify-between">
          <span>{t(STAT_KEYS[stat])}</span>
          <span className="text-[#e8d5a3]" data-stat={stat}>
            {stats[stat] ?? 0}
          </span>
        </div>
      ))}
    </div>
  );
};

export type StatsDialogProps = {
  open: boolean;
  onClose: () => void;
  stats: Partial<StatTotals>;
};

// The stats summary as a game dialog.
export const StatsDialog = ({ open, onClose, stats }: StatsDialogProps) => {
  const t = useUiText();
  return (
    <GameDialog open={open} onClose={onClose} name="stats" className="max-w-xs">
      <GamePanel onClose={onClose}>
        <div className="px-10 py-6">
          <GameDialogTitle>{t("stats.title")}</GameDialogTitle>
          <div className="mt-5 text-[#c0b89a] flex gap-5 w-full">
            <div className="flex flex-col gap-5 w-full">
              <h3 className="font-medium text-[#e8d5a3]">{t("stats.basic")}</h3>
              <StatsList stats={stats} />
            </div>
          </div>
          <div className="w-full flex justify-end mt-6">
            <GameButton variant="text" type="button" onClick={onClose}>
              {t("stats.close")}
            </GameButton>
          </div>
        </div>
      </GamePanel>
    </GameDialog>
  );
};

export type StatsButtonProps = {
  stats: Partial<StatTotals>;
  // The button's content. Defaults to the "Stats" label.
  children?: ReactNode;
} & Omit<GameButtonProps, "children" | "onClick">;

// A game button that opens the StatsDialog.
export const StatsButton = ({ stats, children, ...props }: StatsButtonProps) => {
  const t = useUiText();
  const [open, setOpen] = useState(false);
  return (
    <>
      <GameButton type="button" data-hud="stats" {...props} onClick={() => setOpen(true)}>
        {children ?? t("stats.button")}
      </GameButton>
      <StatsDialog open={open} onClose={() => setOpen(false)} stats={stats} />
    </>
  );
};
