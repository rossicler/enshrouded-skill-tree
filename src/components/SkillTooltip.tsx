import { Tooltip } from "react-tooltip";
import { useTranslation } from "next-i18next";
import { useEffect, useId, useState } from "react";
import { Link2 } from "lucide-react";

import SkillNodes, { Node } from "../constants/Nodes";
import Image from "next/image";
import DOMPurify from "dompurify";
import { classNames } from "@/utils/utils";

import { gameToast } from "@/utils/gameToast";
import GameButton from "./shared/GameButton";

type PropsType = {
  node: Node;
  selected?: boolean;
  selectable?: boolean;
  onSelect?: () => void;
};

const GRADIENT_COLORS: Record<string, { light: string; dark: string }> = {
  green: { light: "#4D8820", dark: "#1D2F0F" },
  blue: { light: "#3066A0", dark: "#102134" },
  red: { light: "#7D1818", dark: "#2B080A" },
  gold: { light: "#BE8400", dark: "#402C01" },
};

const SkillTooltip = ({ node, selected, selectable, onSelect }: PropsType) => {
  const metadata = SkillNodes.types[node.type];
  const { t } = useTranslation(["nodes", "common"]);
  const name = t(`${node.type}.name`, { ns: "nodes" });
  const rawDescription = t(`${node.type}.description`, {
    ns: "nodes",
    returnObjects: true,
  });
  const description = Array.isArray(rawDescription) ? rawDescription : [rawDescription];
  const id = useId();
  const filterId = `rugged-tooltip-${id}`;
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail === node.id) {
        setFlash(true);
        setTimeout(() => setFlash(false), 600);
      }
    };
    window.addEventListener("skill-out-of-range", handler);
    return () => window.removeEventListener("skill-out-of-range", handler);
  }, [node.id]);

  const colors = GRADIENT_COLORS[metadata.color] ?? GRADIENT_COLORS.green;
  const gradient = `linear-gradient(187deg, ${colors.light} 0%, ${colors.dark} 100%)`;

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}?focus=${node.id}`;
    navigator.clipboard.writeText(url).then(() => {
      gameToast.success(t("toasts.shareUrlCopied", { ns: "common" }));
    });
  };

  return (
    <Tooltip
      anchorSelect={`[data-tooltip-id="skill-tooltip-${node.id}"]`}
      className="!p-0 !bg-transparent !border-0 !rounded-none"
      style={{ zIndex: 9999 }}
      noArrow
      clickable
      delayShow={750}
      delayHide={0}
    >
      <div className="relative max-w-sm min-w-[260px]">
        {/* SVG filter for rugged edges */}
        <svg className="absolute w-0 h-0" aria-hidden="true">
          <defs>
            <filter id={filterId} x="-2%" y="-2%" width="104%" height="104%">
              <feTurbulence
                type="turbulence"
                baseFrequency="0.04"
                numOctaves="4"
                seed="2"
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="3"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>

        {/* Rugged background */}
        <div
          style={{ filter: `url(#${filterId})`, background: gradient }}
          className="absolute inset-0 border border-black/30"
        />

        {/* Circle pattern overlay */}
        <div
          className="absolute inset-0 overflow-hidden opacity-[0.08]"
          style={{
            backgroundImage: "url(/assets/decorations/bg-circles-tiled.svg)",
            backgroundRepeat: "repeat",
            backgroundSize: "456px 456px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 px-5 py-4">
          {/* Title */}
          <h3 className="uppercase text-lg text-white font-bold tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
            {name}
          </h3>

          {/* Description */}
          <div className="flex flex-col gap-1.5 text-sm text-white/90 leading-relaxed">
            {description.map((html, i) => (
              <div
                key={`${node.id}-p${i}`}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
              />
            ))}
          </div>

          {/* Divider */}
          <img src="/assets/decorations/divider.svg" alt="" className="w-full mt-2 mb-3" />

          {/* Bottom row: cost left, status right */}
          <div className="flex items-center justify-between mt-4">
            {/* Cost */}
            <div className="flex items-center gap-1.5">
              <Image
                src="/assets/skill_point.png"
                alt={t("accessibility.skillPointIcon", { ns: "common" })}
                width={20}
                height={20}
              />
              <span className="text-white font-bold text-sm">
                {metadata.cost}
              </span>
            </div>

            {/* Status */}
            <div className="flex items-center">
              <GameButton variant="text" onClick={handleShare} title={t("skillTooltip.share", { ns: "common" })}>
                <Link2 size={14} />
              </GameButton>
              <span className="w-px h-4 bg-white/20 mx-1 shrink-0" />
              {selected ? (
                <GameButton variant="text" onClick={onSelect}>
                  {t("skillTooltip.refund", { ns: "common" })}
                </GameButton>
              ) : selectable ? (
                <GameButton variant="text" onClick={onSelect}>
                  {t("skillTooltip.unlock", { ns: "common" })}
                </GameButton>
              ) : (
                <span className={classNames(
                  "text-red-400 text-sm font-semibold uppercase tracking-wide transition-all duration-300",
                  flash && "text-red-300 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)] scale-110"
                )}>
                  {t("skillTooltip.outOfRange", { ns: "common" })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Tooltip>
  );
};

export default SkillTooltip;
