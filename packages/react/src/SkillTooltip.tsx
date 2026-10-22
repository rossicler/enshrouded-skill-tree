import { useId } from "react";
import DOMPurify from "dompurify";
import { SkillNodes, getMaxLevel, getSkillText, type SkillAction } from "@enshrouded/core";

import { assetUrl, type NodeState } from "./art";
import { GameButton } from "./kit/GameButton";
import { RuggedFilter } from "./kit/shared";
import { uiText } from "./text";

const GRADIENT_COLORS: Record<string, { light: string; dark: string }> = {
  green: { light: "#4D8820", dark: "#1D2F0F" },
  blue: { light: "#3066A0", dark: "#102134" },
  red: { light: "#7D1818", dark: "#2B080A" },
  gold: { light: "#BE8400", dark: "#402C01" },
};

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

// lucide "link-2"
const LinkIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 17H7A5 5 0 0 1 7 7h2" />
    <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
    <line x1="8" x2="16" y1="12" y2="12" />
  </svg>
);

export type SkillTooltipCardProps = {
  nodeId: string;
  state: NodeState;
  level: number;
  // The out-of-range label is flashing after a refused click.
  flash: boolean;
  locale: string;
  assetBaseUrl: string;
  // Hides the buttons that change the build.
  readOnly: boolean;
  onAction: (nodeId: string, action: SkillAction) => void;
  onShare?: (nodeId: string) => void;
  // Shows a close (×) button.
  onClose?: () => void;
};

// lucide "x"
const CloseIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

// The card shown over a hovered node: name, level, description, cost and actions.
export const SkillTooltipCard = ({
  nodeId,
  state,
  level,
  flash,
  locale,
  assetBaseUrl,
  readOnly,
  onAction,
  onShare,
  onClose,
}: SkillTooltipCardProps) => {
  const node = SkillNodes.nodes[nodeId];
  const filterId = `rugged-tooltip-${useId().replace(/[^\w-]/g, "")}`;
  if (!node) return null;
  const metadata = SkillNodes.types[node.type];
  const maxLevel = getMaxLevel(node.type);
  // Level-1 values preview a skill that isn't selected yet. Skill text is
  // unescaped HTML, so it is sanitized as the last step.
  const { name, description, perLevelLabel } = getSkillText(node.type, locale, level > 0 ? level : 1);
  const t = (key: Parameters<typeof uiText>[1], values?: Record<string, string | number>) => uiText(locale, key, values);
  const colors = GRADIENT_COLORS[metadata.color] ?? GRADIENT_COLORS.green;
  const gradient = `linear-gradient(187deg, ${colors.light} 0%, ${colors.dark} 100%)`;
  const button = (action: string, label: string, skillAction: SkillAction) => (
    <GameButton variant="text" type="button" data-action={action} onClick={() => onAction(nodeId, skillAction)}>
      {label}
    </GameButton>
  );
  const selectable = state !== "locked";

  return (
    <div className="relative max-w-sm min-w-[260px]" data-skill-tooltip={nodeId}>
      <RuggedFilter id={filterId} />
      <div style={{ filter: `url(#${filterId})`, background: gradient }} className="absolute inset-0 border border-black/30" />
      <div
        className="absolute inset-0 overflow-hidden opacity-[0.08]"
        style={{
          backgroundImage: `url(${assetUrl(assetBaseUrl, "decorations/bg-circles-tiled.svg")})`,
          backgroundRepeat: "repeat",
          backgroundSize: "456px 456px",
        }}
      />

      {onClose && (
        // A 44 px target in the corner, with a small mark inside.
        <button
          type="button"
          data-tooltip-close=""
          aria-label={t("tooltip.close")}
          title={t("tooltip.close")}
          onClick={onClose}
          className="absolute top-0 right-0 z-20 flex h-11 w-11 items-center justify-center text-white/70 hover:text-white focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400/80"
        >
          <CloseIcon />
        </button>
      )}
      <div className="relative z-10 px-5 py-4">
        <h3 className={cx("uppercase text-lg text-white font-bold tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]", onClose && "pr-6")}>
          {name}
        </h3>
        {maxLevel > 1 && (
          <div className="text-xs text-[#e8d5a3]/80 font-semibold tracking-wide mt-0.5 mb-1">
            {t("tooltip.levelHeader", { current: level, max: maxLevel })}
          </div>
        )}
        <div className="flex flex-col gap-1.5 text-sm text-white/90 leading-relaxed">
          {description.map((html, i) => (
            <div key={`${nodeId}-p${i}`} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
          ))}
        </div>
        {perLevelLabel && (
          <div className="text-xs text-[#e8d5a3]/80 italic mt-2" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(perLevelLabel) }} />
        )}
        <img src={assetUrl(assetBaseUrl, "decorations/divider.svg")} alt="" className="w-full mt-2 mb-3" />

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-1.5">
            <img src={assetUrl(assetBaseUrl, "ui/skill_point.png")} alt={t("tooltip.skillPointIcon")} width={20} height={20} />
            <span className="text-white font-bold text-sm">{metadata.cost}</span>
          </div>

          <div className="flex items-center">
            {onShare && (
              <>
                <GameButton variant="text" type="button" data-action="share" onClick={() => onShare(nodeId)} title={t("tooltip.share")}>
                  <LinkIcon />
                </GameButton>
                <span className="w-px h-4 bg-white/20 mx-1 shrink-0" />
              </>
            )}
            {!readOnly && level === 0 && selectable && button("unlock", t("tooltip.unlock"), "primary")}
            {level === 0 && !selectable && (
              <span
                data-out-of-range
                data-flash={flash ? "true" : "false"}
                className={cx(
                  "text-[#f87171] text-sm font-semibold uppercase tracking-wide transition-all duration-300",
                  flash && "text-[#fca5a5] drop-shadow-[0_0_8px_rgba(248,113,113,0.8)] scale-110"
                )}
              >
                {t("tooltip.outOfRange")}
              </span>
            )}
            {!readOnly && level > 0 && level < maxLevel && (
              <>
                {button("refund-one", t("tooltip.refundOne"), "secondary")}
                {button("level-up", t("tooltip.levelUp"), "primary")}
              </>
            )}
            {!readOnly && level > 0 && level === maxLevel && maxLevel > 1 && (
              <>
                {button("refund-one", t("tooltip.refundOne"), "secondary")}
                {button("refund-all", t("tooltip.refundAll"), "primary")}
              </>
            )}
            {!readOnly && level > 0 && maxLevel === 1 && button("refund", t("tooltip.refund"), "primary")}
          </div>
        </div>
      </div>
    </div>
  );
};
