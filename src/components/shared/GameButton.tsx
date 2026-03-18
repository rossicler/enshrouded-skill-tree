import React, { ReactNode, useId } from "react";
import { classNames } from "../../utils/utils";
import { playSound } from "../../utils/sounds";

type PropsType = {
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
  grouped?: boolean;
  variant?: "default" | "text";
  noDecorations?: boolean;
} & JSX.IntrinsicElements["button"];

const DECORATION_FILTER =
  "[filter:brightness(0)_saturate(100%)_invert(88%)_sepia(15%)_saturate(500%)_hue-rotate(10deg)_brightness(95%)]";

const GameButton = ({
  children,
  onClick,
  className,
  grouped,
  variant = "default",
  noDecorations = false,
  disabled,
  ...props
}: PropsType) => {
  const id = useId();
  const filterId = `rugged-${id}`;

  if (variant === "text") {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => !disabled && playSound("button-hover", 0.3)}
        className={classNames(
          "group relative inline-flex items-center justify-center overflow-hidden",
          "px-4 py-2 min-h-[40px]",
          "text-sm font-semibold tracking-wide",
          "transition-all duration-150",
          disabled && "cursor-not-allowed opacity-40",
          className
        )}
        {...props}
      >
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
        <span
          style={{ filter: `url(#${filterId})` }}
          className={classNames(
            "absolute inset-0 opacity-0 transition-opacity duration-150",
            !disabled && "group-hover:opacity-100",
            "bg-black/20"
          )}
        />
        <span
          className={classNames(
            "relative z-10 font-semibold tracking-wide text-sm",
            "text-[#e8d5a3] drop-shadow-[0_0_4px_rgba(202,152,3,0.4)]"
          )}
        >
          {children}
        </span>
      </button>
    );
  }

  if (grouped) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => !disabled && playSound("button-hover", 0.3)}
        className={classNames(
          "group/btn relative flex items-center justify-center",
          "px-8 py-2.5 min-h-[40px] min-w-[140px]",
          "transition-all duration-150",
          disabled && "cursor-not-allowed opacity-40",
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

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && playSound("button-hover", 0.3)}
      className={classNames(
        "group relative inline-flex items-center justify-center overflow-hidden",
        "px-8 py-2.5 min-h-[40px] min-w-[140px]",
        "transition-all duration-150",
        disabled && "cursor-not-allowed opacity-40",
        className
      )}
      {...props}
    >
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

      <span
        style={{ filter: `url(#${filterId})` }}
        className={classNames(
          "absolute inset-0",
          "border border-[#5a5a60]",
          "bg-gradient-to-b from-[#4a4a50] via-[#35353a] to-[#28282d]",
          "shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-2px_3px_rgba(0,0,0,0.4),0_3px_6px_rgba(0,0,0,0.6)]",
          "border-t-[#6a6a72] border-b-[#1a1a1e]",
          !disabled && "group-hover:from-[#55555b] group-hover:via-[#3d3d42] group-hover:to-[#303035]",
          !disabled && "group-hover:border-[#6a6a70] group-hover:border-t-[#78787f]",
          !disabled && "group-active:from-[#2a2a2f] group-active:via-[#252528] group-active:to-[#202025]",
          !disabled && "group-active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]",
          !disabled && "group-active:border-t-[#4a4a50] group-active:border-b-[#1a1a1e]",
          "transition-all duration-150"
        )}
      >
        <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.12)] to-transparent" />
        <span className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[rgba(0,0,0,0.4)] to-transparent" />
      </span>

      {!noDecorations && (
        <img
          src="/assets/decorations/button-decoration.svg"
          alt=""
          className={classNames(
            "absolute left-0 top-1/2 -translate-y-1/2 h-full w-auto pointer-events-none hidden md:block",
            disabled ? "opacity-80" : "opacity-80 group-hover:opacity-100",
            "transition-opacity",
            DECORATION_FILTER
          )}
        />
      )}
      {!noDecorations && (
        <img
          src="/assets/decorations/button-decoration.svg"
          alt=""
          className={classNames(
            "absolute right-0 top-1/2 -translate-y-1/2 h-full w-auto pointer-events-none hidden md:block",
            disabled ? "opacity-80" : "opacity-80 group-hover:opacity-100",
            "transition-opacity -scale-x-100",
            DECORATION_FILTER
          )}
        />
      )}

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

export default GameButton;
