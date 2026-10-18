import type { ReactNode } from "react";
import { X } from "lucide-react";

import { useUiText } from "../text";
import { RuggedFilter, classNames, useAssetUrl, useFilterId } from "./shared";

export type GamePanelProps = {
  children: ReactNode;
  className?: string;
  // Shows a close button in the top-right corner.
  onClose?: () => void;
};

// The game's slate panel with gold borders. From the md breakpoint up it gets
// rugged borders, faded sides and corner ornaments that reach outside it, so
// leave about 40 px around it there.
export const GamePanel = ({ children, className, onClose }: GamePanelProps) => {
  const filterId = useFilterId("rugged-panel");
  const asset = useAssetUrl();
  const t = useUiText();

  return (
    <div className={classNames("relative", className)}>
      <RuggedFilter id={filterId} />

      {/* Main background with horizontal fade on edges — desktop only */}
      <div
        className="absolute inset-0 overflow-hidden hidden md:block"
        style={{ background: "linear-gradient(to right, transparent, #414255 16px, #414255 calc(100% - 16px), transparent)" }}
      />

      {/* Plain background — mobile only */}
      <div className="absolute inset-0 bg-[#414255] md:hidden" />

      {/* Tiling circle pattern background */}
      <div
        className="absolute inset-0 overflow-hidden opacity-[0.10]"
        style={{
          backgroundImage: `url(${asset("decorations/bg-circles-tiled.svg")})`,
          backgroundRepeat: "repeat",
          backgroundSize: "456px 456px",
        }}
      />

      {/* Rugged golden borders — desktop only */}
      <div style={{ filter: `url(#${filterId})` }} className="absolute top-0 left-0 right-0 h-[5px] bg-[#C8B169] hidden md:block" />
      <div style={{ filter: `url(#${filterId})` }} className="absolute bottom-0 left-0 right-0 h-[5px] bg-[#C8B169] hidden md:block" />

      {/* Simple golden borders — mobile only */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#C8B169] md:hidden" />
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C8B169] md:hidden" />

      {/* Corner decorations — desktop only */}
      <img
        src={asset("decorations/modal-top-left.svg")}
        alt=""
        className="absolute -top-[34px] -left-[38px] pointer-events-none w-[75px] h-auto hidden md:block"
      />
      <img
        src={asset("decorations/modal-top-right.svg")}
        alt=""
        className="absolute -top-[15px] -right-[19px] pointer-events-none w-[29px] h-auto hidden md:block"
      />
      <img
        src={asset("decorations/modal-bottom-left.svg")}
        alt=""
        className="absolute -bottom-[8px] -left-[9px] pointer-events-none w-[20px] h-auto hidden md:block"
      />
      <img
        src={asset("decorations/modal-bottom-right.svg")}
        alt=""
        className="absolute -bottom-[14px] -right-[16px] pointer-events-none w-[32px] h-auto hidden md:block"
      />

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className={classNames(
            "absolute top-[27px] right-5 z-20",
            "text-[#c0b89a] hover:text-[#e8d5a3] transition-colors",
            "focus:outline-hidden"
          )}
          aria-label={t("kit.close")}
        >
          <X size={18} />
        </button>
      )}

      <div className="relative z-10 py-2">{children}</div>
    </div>
  );
};
