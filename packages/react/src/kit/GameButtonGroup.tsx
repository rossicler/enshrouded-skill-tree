import type { ReactNode } from "react";

import { BEVEL_CLASSES, BevelLines, DECORATION_FILTER, RuggedFilter, classNames, useAssetUrl, useFilterId } from "./shared";

export type GameButtonGroupProps = {
  // GameButtons with `grouped`, and other controls (the flame level input).
  children: ReactNode;
  className?: string;
  vertical?: boolean;
};

// One beveled background for several buttons, with dividers between them.
export const GameButtonGroup = ({ children, className, vertical }: GameButtonGroupProps) => {
  const filterId = useFilterId("rugged-group");
  const asset = useAssetUrl();

  return (
    <div className={classNames("relative flex flex-col overflow-hidden", className)}>
      <RuggedFilter id={filterId} />

      {/* Rugged background spanning the whole group */}
      <span style={{ filter: `url(#${filterId})` }} className={classNames("absolute inset-0 pointer-events-none", ...BEVEL_CLASSES)}>
        <BevelLines />
      </span>

      {/* Side ornaments, from the md breakpoint up */}
      <img
        src={asset("decorations/button-decoration.svg")}
        alt=""
        className={classNames(
          "absolute left-0 top-1/2 -translate-y-1/2 h-full w-auto pointer-events-none opacity-80 hidden md:block",
          DECORATION_FILTER
        )}
      />
      <img
        src={asset("decorations/button-decoration.svg")}
        alt=""
        className={classNames(
          "absolute right-0 top-1/2 -translate-y-1/2 -scale-x-100 h-full w-auto pointer-events-none opacity-80 hidden md:block",
          DECORATION_FILTER
        )}
      />

      {/* Buttons with dividers */}
      <div
        className={classNames(
          "relative z-10 flex",
          vertical ? "flex-col divide-y divide-[#5a5a60]/40" : "flex-row divide-x divide-[#5a5a60]/40"
        )}
      >
        {children}
      </div>
    </div>
  );
};
