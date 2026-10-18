import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { useSkillTreeSettings } from "../SkillTreeProvider";
import { BEVEL_CLASSES, BevelLines, DECORATION_FILTER, RuggedFilter, classNames, useAssetUrl, useFilterId } from "./shared";

export type GameButtonProps = {
  children?: ReactNode;
  className?: string;
  // Inside a GameButtonGroup: no background of its own, a hover tint only.
  grouped?: boolean;
  // "text": a label with a rugged hover shade, for dialog actions.
  variant?: "default" | "text";
  // Hides the side ornaments of the default variant.
  noDecorations?: boolean;
} & ComponentPropsWithoutRef<"button">;

// The game's beveled steel button. It plays the provider's hover sound.
export const GameButton = ({
  children,
  onMouseEnter,
  className,
  grouped,
  variant = "default",
  noDecorations = false,
  disabled,
  ...props
}: GameButtonProps) => {
  const filterId = useFilterId("rugged");
  const { playSound } = useSkillTreeSettings();
  const asset = useAssetUrl();
  const hover = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) playSound("node-hover", 0.3);
    onMouseEnter?.(event);
  };

  if (variant === "text") {
    return (
      <button
        disabled={disabled}
        onMouseEnter={hover}
        className={classNames(
          "group relative inline-flex items-center justify-center overflow-hidden",
          "px-4 py-2 min-h-[40px]",
          "text-sm font-semibold tracking-wide",
          "transition-all duration-150",
          disabled && "opacity-40",
          className
        )}
        {...props}
      >
        <RuggedFilter id={filterId} />
        <span
          style={{ filter: `url(#${filterId})` }}
          className={classNames(
            "absolute inset-0 opacity-0 transition-opacity duration-150",
            !disabled && "group-hover:opacity-100",
            "bg-black/20"
          )}
        />
        <span className="relative z-10 font-semibold tracking-wide text-sm text-[#e8d5a3] drop-shadow-[0_0_4px_rgba(202,152,3,0.4)]">
          {children}
        </span>
      </button>
    );
  }

  if (grouped) {
    return (
      <button
        disabled={disabled}
        onMouseEnter={hover}
        className={classNames(
          "group/btn relative flex items-center justify-center",
          "px-8 py-2.5 min-h-[40px] min-w-[140px]",
          "transition-all duration-150",
          disabled && "opacity-40",
          className
        )}
        {...props}
      >
        {/* Hover background */}
        <span
          className={classNames(
            "absolute inset-0 transition-colors duration-150",
            !disabled && "group-hover/btn:bg-white/[0.06]",
            !disabled && "group-active/btn:bg-black/10"
          )}
        />
        <span
          className={classNames(
            "relative z-10 font-semibold tracking-wide text-sm",
            "text-[#e8d5a3] drop-shadow-[0_0_4px_rgba(202,152,3,0.4)]",
            !disabled && "group-hover/btn:text-[#f0e0b5] group-hover/btn:drop-shadow-[0_0_6px_rgba(202,152,3,0.6)]"
          )}
        >
          {children}
        </span>
      </button>
    );
  }

  const decoration = (side: "left" | "right") => (
    <img
      src={asset("decorations/button-decoration.svg")}
      alt=""
      className={classNames(
        side === "left" ? "absolute left-0" : "absolute right-0",
        "top-1/2 -translate-y-1/2 h-full w-auto pointer-events-none hidden md:block",
        disabled ? "opacity-80" : "opacity-80 group-hover:opacity-100",
        side === "left" ? "transition-opacity" : "transition-opacity -scale-x-100",
        DECORATION_FILTER
      )}
    />
  );

  return (
    <button
      disabled={disabled}
      onMouseEnter={hover}
      className={classNames(
        "group relative inline-flex items-center justify-center overflow-hidden",
        "px-8 py-2.5 min-h-[40px] min-w-[140px]",
        "transition-all duration-150",
        disabled && "opacity-40",
        className
      )}
      {...props}
    >
      <RuggedFilter id={filterId} />

      <span
        style={{ filter: `url(#${filterId})` }}
        className={classNames(
          "absolute inset-0",
          ...BEVEL_CLASSES,
          !disabled && "group-hover:from-[#55555b] group-hover:via-[#3d3d42] group-hover:to-[#303035]",
          !disabled && "group-hover:border-[#6a6a70] group-hover:border-t-[#78787f]",
          !disabled && "group-active:from-[#2a2a2f] group-active:via-[#252528] group-active:to-[#202025]",
          !disabled && "group-active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]",
          !disabled && "group-active:border-t-[#4a4a50] group-active:border-b-[#1a1a1e]",
          "transition-all duration-150"
        )}
      >
        <BevelLines />
      </span>

      {!noDecorations && decoration("left")}
      {!noDecorations && decoration("right")}

      <span
        className={classNames(
          "relative z-10 font-semibold tracking-wide text-sm",
          "text-[#e8d5a3] drop-shadow-[0_0_4px_rgba(202,152,3,0.4)]",
          !disabled && "group-hover:text-[#f0e0b5] group-hover:drop-shadow-[0_0_6px_rgba(202,152,3,0.6)]"
        )}
      >
        {children}
      </span>
    </button>
  );
};
