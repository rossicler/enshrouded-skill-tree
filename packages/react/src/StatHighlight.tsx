import { useId, type ReactNode } from "react";
import { BasicStats, getStatSkillTypes, type StatsType } from "@enshrouded/core";

import { useSkillTreeSettings } from "./SkillTreeProvider";
import { useUiText } from "./text";
import { GameButton } from "./kit/GameButton";
import { HudToggle, type HudToggleProps } from "./kit/HudToggle";
import { GamePanel } from "./kit/GamePanel";
import { classNames } from "./kit/shared";

// Ring color per stat on the tree. Each stat gets its own hue, so two stats
// that share a branch color in the game (Strength and Constitution are both
// red) still read apart.
export const STAT_HIGHLIGHT_COLORS = {
  STR: "#ef4444",
  CONS: "#f472b6",
  DEX: "#22c55e",
  ENDURANCE: "#facc15",
  INT: "#3b82f6",
  SPIRIT: "#c084fc",
} as const satisfies Record<StatsType, string>;

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


// Skill type -> ring colors for the highlighted stats, for SkillTreeView's
// markedTypes. A type that raises several highlighted stats (Ranger: Dexterity
// and Endurance) gets one color per stat, which splits its ring; with only one
// of its stats highlighted it keeps that stat's single color. Colors follow
// the stats' fixed order, not the order they were toggled in.
export const getStatMarkers = (stats: readonly string[]): Record<string, string[]> => {
  const highlighted = new Set(stats);
  const markers: Record<string, string[]> = {};
  for (const stat of STATS) {
    if (!highlighted.has(stat)) continue;
    for (const type of getStatSkillTypes(stat)) (markers[type] ??= []).push(STAT_HIGHLIGHT_COLORS[stat]);
  }
  return markers;
};

export type StatHighlightPanelProps = {
  // The highlighted stat keys (see BasicStats in @enshrouded/core).
  value: readonly string[];
  onChange: (stats: StatsType[]) => void;
  className?: string;
};

// The panel's content: a toggle per stat with its ring color, plus "all" and
// "none". The toggles form a labelled group for screen readers.
export const StatHighlightList = ({ value, onChange, className }: StatHighlightPanelProps) => {
  const t = useUiText();
  const { playSound } = useSkillTreeSettings();
  const titleId = useId();
  const active = new Set(value);

  const toggle = (stat: StatsType) => {
    const on = active.has(stat);
    playSound(on ? "node-refund" : "node-unlock", 0.4);
    onChange(STATS.filter((s) => (s === stat ? !on : active.has(s))));
  };
  const setAll = (on: boolean) => {
    playSound(on ? "node-unlock" : "node-refund", 0.4);
    onChange(on ? [...STATS] : []);
  };

  return (
    <div className={className}>
      <span id={titleId} className="text-sm text-[#e8d5a3]">
        {t("statHighlight.title")}
      </span>
      <ul role="group" aria-labelledby={titleId} className="mt-2 space-y-0.5">
        {STATS.map((stat) => {
          const checked = active.has(stat);
          const color = STAT_HIGHLIGHT_COLORS[stat];
          return (
            <li key={stat}>
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                data-stat-highlight={stat}
                onClick={() => toggle(stat)}
                onMouseEnter={() => playSound("node-hover", 0.3)}
                className="w-full flex items-center gap-2.5 py-1.5 group"
              >
                <span
                  className={classNames(
                    "inline-flex w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-colors",
                    !checked && "group-hover:opacity-80"
                  )}
                  style={{ borderColor: color, backgroundColor: checked ? color : "transparent" }}
                />
                <span className={classNames("text-sm", checked ? "text-[#e8d5a3]" : "text-[#c0b89a]")}>
                  {t(STAT_KEYS[stat])}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex justify-between mt-1 -mx-2">
        <GameButton variant="text" type="button" onClick={() => setAll(true)} disabled={active.size === STATS.length}>
          {t("statHighlight.all")}
        </GameButton>
        <GameButton variant="text" type="button" onClick={() => setAll(false)} disabled={active.size === 0}>
          {t("statHighlight.none")}
        </GameButton>
      </div>
    </div>
  );
};

// The list in a standalone game panel, for use outside the HUD toggle.
export const StatHighlightPanel = ({ className, ...props }: StatHighlightPanelProps) => (
  <GamePanel className={className}>
    <StatHighlightList {...props} className="px-5 py-3" />
  </GamePanel>
);

export type StatHighlightButtonProps = Omit<StatHighlightPanelProps, "className"> &
  Omit<HudToggleProps, "label" | "children" | "panelName" | "onChange" | "value"> & {
    // The button's content. Defaults to the "Highlight" label.
    children?: ReactNode;
  };

// A HUD button that shows or hides the stat toggles just below it (see
// HudToggle: a second click or Escape closes it). The button shows a dot per
// highlighted stat in its color.
export const StatHighlightButton = ({ value, onChange, children, ...toggleProps }: StatHighlightButtonProps) => {
  const t = useUiText();
  // In the stats' fixed order, like the rings.
  const highlighted = STATS.filter((stat) => value.includes(stat));
  return (
    <HudToggle
      data-hud="stat-highlight"
      panelName="stat-highlight"
      {...toggleProps}
      label={
        // The dots sit under the label, out of the flow, so they never widen
        // the button.
        <span className="relative inline-flex items-center justify-center">
          {children ?? t("statHighlight.button")}
          {highlighted.length > 0 && (
            <span
              className="absolute left-1/2 -translate-x-1/2 -bottom-2 flex gap-0.5"
              data-stat-highlight="dots"
              aria-hidden
            >
              {highlighted.map((stat) => (
                <span key={stat} className="w-1 h-1 rounded-full" style={{ backgroundColor: STAT_HIGHLIGHT_COLORS[stat] }} />
              ))}
            </span>
          )}
        </span>
      }
    >
      <StatHighlightList value={value} onChange={onChange} />
    </HudToggle>
  );
};
