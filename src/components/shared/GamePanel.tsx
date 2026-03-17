import React, { ReactNode, useId } from "react";
import { X } from "lucide-react";
import { classNames } from "../../utils/utils";

type PropsType = {
  children: ReactNode;
  className?: string;
  onClose?: () => void;
};

const GamePanel = ({ children, className, onClose }: PropsType) => {
  const id = useId();
  const filterId = `rugged-panel-${id}`;

  return (
    <div className={classNames("relative", className)}>
      {/* SVG filter for rugged golden borders */}
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

      {/* Main background with horizontal fade on edges — desktop only */}
      <div
        className="absolute inset-0 overflow-hidden hidden md:block"
        style={{
          background:
            "linear-gradient(to right, transparent, #414255 16px, #414255 calc(100% - 16px), transparent)",
        }}
      />

      {/* Plain background — mobile only */}
      <div className="absolute inset-0 bg-[#414255] md:hidden" />

      {/* Tiling circle pattern background */}
      <div
        className="absolute inset-0 overflow-hidden opacity-[0.10]"
        style={{
          backgroundImage: "url(/assets/decorations/bg-circles-tiled.svg)",
          backgroundRepeat: "repeat",
          backgroundSize: "456px 456px",
        }}
      />

      {/* Top golden border - rugged (desktop only) */}
      <div
        style={{ filter: `url(#${filterId})` }}
        className="absolute top-0 left-0 right-0 h-[5px] bg-[#C8B169] hidden md:block"
      />

      {/* Bottom golden border - rugged (desktop only) */}
      <div
        style={{ filter: `url(#${filterId})` }}
        className="absolute bottom-0 left-0 right-0 h-[5px] bg-[#C8B169] hidden md:block"
      />

      {/* Simple golden borders — mobile only */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#C8B169] md:hidden" />
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C8B169] md:hidden" />

      {/* Corner decorations — desktop only */}
      <img
        src="/assets/decorations/modal-top-left.svg"
        alt=""
        className="absolute -top-[34px] -left-[38px] pointer-events-none w-[75px] h-auto hidden md:block"
      />
      <img
        src="/assets/decorations/modal-top-right.svg"
        alt=""
        className="absolute -top-[15px] -right-[19px] pointer-events-none w-[29px] h-auto hidden md:block"
      />
      <img
        src="/assets/decorations/modal-bottom-left.svg"
        alt=""
        className="absolute -bottom-[8px] -left-[9px] pointer-events-none w-[20px] h-auto hidden md:block"
      />
      <img
        src="/assets/decorations/modal-bottom-right.svg"
        alt=""
        className="absolute -bottom-[14px] -right-[16px] pointer-events-none w-[32px] h-auto hidden md:block"
      />

      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className={classNames(
            "absolute top-[27px] right-5 z-20",
            "text-[#c0b89a] hover:text-[#e8d5a3] transition-colors",
            "focus:outline-none"
          )}
          aria-label="Close"
        >
          <X size={18} />
        </button>
      )}

      {/* Content */}
      <div className="relative z-10 py-2">{children}</div>
    </div>
  );
};

export default GamePanel;
