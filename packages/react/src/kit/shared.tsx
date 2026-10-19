import { useId } from "react";
import { twMerge, type ClassNameValue } from "tailwind-merge";

import { assetUrl } from "../art";
import { useSkillTreeSettings } from "../SkillTreeProvider";

// Joins class names; later Tailwind classes win over conflicting earlier ones,
// so callers can override the kit's defaults through className.
export const classNames = (...classes: ClassNameValue[]) => twMerge(classes);

// Tints the decoration SVGs to the kit's gold.
export const DECORATION_FILTER =
  "[filter:brightness(0)_saturate(100%)_invert(88%)_sepia(15%)_saturate(500%)_hue-rotate(10deg)_brightness(95%)]";

// The gold text and glow most kit labels use.
export const GOLD_TEXT = "text-[#e8d5a3] drop-shadow-[0_0_4px_rgba(202,152,3,0.4)]";

// An id for an SVG filter, safe inside CSS url(#...).
export const useFilterId = (prefix: string) => `${prefix}-${useId().replace(/[^\w-]/g, "")}`;

// Torn-paper edges: an SVG filter the kit applies with style.filter.
export const RuggedFilter = ({ id }: { id: string }) => (
  <svg className="absolute w-0 h-0" aria-hidden="true">
    <defs>
      <filter id={id} x="-2%" y="-2%" width="104%" height="104%">
        <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="4" seed="2" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  </svg>
);

// URL of a file in this package's assets/ folder, as the host serves it.
export const useAssetUrl = () => {
  const { assetBaseUrl } = useSkillTreeSettings();
  return (file: string) => assetUrl(assetBaseUrl, file);
};

// The rugged, beveled steel background of buttons, groups and inputs.
export const BEVEL_CLASSES = [
  "border border-[#5a5a60]",
  "bg-gradient-to-b from-[#4a4a50] via-[#35353a] to-[#28282d]",
  "shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-2px_3px_rgba(0,0,0,0.4),0_3px_6px_rgba(0,0,0,0.6)]",
  "border-t-[#6a6a72] border-b-[#1a1a1e]",
];

// The thin highlight and shadow lines along the bevel's top and bottom.
export const BevelLines = () => (
  <>
    <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.12)] to-transparent" />
    <span className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[rgba(0,0,0,0.4)] to-transparent" />
  </>
);
