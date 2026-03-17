import React, { forwardRef, useId } from "react";
import { classNames } from "../../utils/utils";

type PropsType = {
  className?: string;
  variant?: "decorated" | "plain";
  hideDecorationsClassName?: string;
} & Omit<JSX.IntrinsicElements["input"], "className">;

const DECORATION_FILTER =
  "[filter:brightness(0)_saturate(100%)_invert(88%)_sepia(15%)_saturate(500%)_hue-rotate(10deg)_brightness(95%)]";

const GameInput = forwardRef<HTMLInputElement, PropsType>(({ className, variant = "decorated", hideDecorationsClassName, ...props }, ref) => {
  const id = useId();
  const filterId = `rugged-input-${id}`;

  if (variant === "plain") {
    return (
      <input
        className={classNames(
          "w-full h-10 border border-[#5a5a60] rounded-sm",
          "bg-[#2a2a35] text-[#e8d5a3] py-1 px-3",
          "outline-none focus:border-[#C8B169] transition-colors",
          "text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }

  return (
    <div className={classNames("relative", className)}>
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

      {/* Rugged background — hidden on mobile when hideDecorationsClassName is set */}
      <span
        style={{ filter: `url(#${filterId})` }}
        className={classNames(
          "absolute inset-0 pointer-events-none",
          "border border-[#5a5a60]",
          "bg-gradient-to-b from-[#4a4a50] via-[#35353a] to-[#28282d]",
          "shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-2px_3px_rgba(0,0,0,0.4),0_3px_6px_rgba(0,0,0,0.6)]",
          "border-t-[#6a6a72] border-b-[#1a1a1e]",
          hideDecorationsClassName
        )}
      >
        <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.12)] to-transparent" />
        <span className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[rgba(0,0,0,0.4)] to-transparent" />
      </span>

      {/* Plain background — shown on mobile when hideDecorationsClassName is set */}
      {hideDecorationsClassName && (
        <>
          <span
            className={classNames(
              "absolute inset-0 pointer-events-none",
              "bg-[#414255] border-b-2 border-[#C8B169]",
              hideDecorationsClassName === "hidden md:block" ? "md:hidden" : ""
            )}
          />
          <div
            className={classNames(
              "absolute inset-0 overflow-hidden opacity-[0.10] pointer-events-none",
              hideDecorationsClassName === "hidden md:block" ? "md:hidden" : ""
            )}
            style={{
              backgroundImage: "url(/assets/decorations/bg-circles-tiled.svg)",
              backgroundRepeat: "repeat",
              backgroundSize: "456px 456px",
            }}
          />
        </>
      )}

      {/* Left decoration */}
      <img
        src="/assets/decorations/button-decoration.svg"
        alt=""
        className={classNames(
          "absolute left-0 top-1/2 -translate-y-1/2 h-full w-auto pointer-events-none",
          "opacity-80",
          DECORATION_FILTER,
          hideDecorationsClassName
        )}
      />
      {/* Right decoration (mirrored) */}
      <img
        src="/assets/decorations/button-decoration.svg"
        alt=""
        className={classNames(
          "absolute right-0 top-1/2 -translate-y-1/2 h-full w-auto pointer-events-none",
          "opacity-80 -scale-x-100",
          DECORATION_FILTER,
          hideDecorationsClassName
        )}
      />

      {/* Input */}
      <input
        className={classNames(
          "relative z-10 w-full bg-transparent",
          "px-8 py-[18px] md:py-2.5",
          "text-sm font-semibold tracking-wide",
          "text-[#e8d5a3] placeholder-[#e8d5a3]/40",
          "focus:outline-none",
          "drop-shadow-[0_0_4px_rgba(202,152,3,0.4)]"
        )}
        ref={ref}
        {...props}
      />
    </div>
  );
});

GameInput.displayName = "GameInput";

export default GameInput;
