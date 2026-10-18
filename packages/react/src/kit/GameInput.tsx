import { forwardRef, type ComponentPropsWithoutRef } from "react";

import { BEVEL_CLASSES, BevelLines, DECORATION_FILTER, RuggedFilter, classNames, useAssetUrl, useFilterId } from "./shared";

export type GameInputProps = {
  // Classes for the wrapper (decorated) or the input (plain).
  className?: string;
  // "decorated": the beveled steel field with side ornaments. "plain": a flat field for forms.
  variant?: "decorated" | "plain";
  // Classes that hide the bevel and ornaments, e.g. "hidden md:block". With
  // exactly that value, a flat slate background shows below md instead.
  hideDecorationsClassName?: string;
} & Omit<ComponentPropsWithoutRef<"input">, "className">;

// The game's text field.
export const GameInput = forwardRef<HTMLInputElement, GameInputProps>(
  ({ className, variant = "decorated", hideDecorationsClassName, ...props }, ref) => {
    const filterId = useFilterId("rugged-input");
    const asset = useAssetUrl();

    if (variant === "plain") {
      return (
        <input
          className={classNames(
            "w-full h-10 border border-[#5a5a60] rounded-xs",
            "bg-[#2a2a35] text-[#e8d5a3] py-1 px-3",
            "outline-hidden focus:border-[#C8B169] transition-colors",
            "text-sm",
            className
          )}
          ref={ref}
          {...props}
        />
      );
    }

    const plainBelowMd = hideDecorationsClassName === "hidden md:block" ? "md:hidden" : "";

    return (
      <div className={classNames("relative", className)}>
        <RuggedFilter id={filterId} />

        {/* Rugged background */}
        <span
          style={{ filter: `url(#${filterId})` }}
          className={classNames("absolute inset-0 pointer-events-none", ...BEVEL_CLASSES, hideDecorationsClassName)}
        >
          <BevelLines />
        </span>

        {/* Plain background where the decorations are hidden */}
        {hideDecorationsClassName && (
          <>
            <span className={classNames("absolute inset-0 pointer-events-none", "bg-[#414255] border-b-2 border-[#C8B169]", plainBelowMd)} />
            <div
              className={classNames("absolute inset-0 overflow-hidden opacity-[0.10] pointer-events-none", plainBelowMd)}
              style={{
                backgroundImage: `url(${asset("decorations/bg-circles-tiled.svg")})`,
                backgroundRepeat: "repeat",
                backgroundSize: "456px 456px",
              }}
            />
          </>
        )}

        <img
          src={asset("decorations/button-decoration.svg")}
          alt=""
          className={classNames(
            "absolute left-0 top-1/2 -translate-y-1/2 h-full w-auto pointer-events-none",
            "opacity-80",
            DECORATION_FILTER,
            hideDecorationsClassName
          )}
        />
        <img
          src={asset("decorations/button-decoration.svg")}
          alt=""
          className={classNames(
            "absolute right-0 top-1/2 -translate-y-1/2 h-full w-auto pointer-events-none",
            "opacity-80 -scale-x-100",
            DECORATION_FILTER,
            hideDecorationsClassName
          )}
        />

        <input
          className={classNames(
            "relative z-10 w-full bg-transparent",
            "px-8 py-[18px] md:py-2.5",
            "text-sm font-semibold tracking-wide",
            "text-[#e8d5a3] placeholder-[#e8d5a3]/40",
            "focus:outline-hidden",
            "drop-shadow-[0_0_4px_rgba(202,152,3,0.4)]"
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

GameInput.displayName = "GameInput";
