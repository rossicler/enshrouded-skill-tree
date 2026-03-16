import React, { ReactNode } from "react";
import { classNames } from "@/utils/utils";

type Position = "top" | "bottom" | "left" | "right";

type PropsType = {
  text: string;
  position?: Position;
  children: ReactNode;
  className?: string;
};

const positionClasses: Record<Position, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-1",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-1",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const Tooltip = ({ text, position = "right", children, className }: PropsType) => {
  return (
    <div className={classNames("group/tooltip relative", className)}>
      {children}
      <div
        className={classNames(
          "pointer-events-none absolute z-50",
          "px-2 py-1 rounded text-xs whitespace-nowrap",
          "text-[#c0b89a] bg-[#2a2a35] border border-[#5a5a60]/50 shadow-lg",
          "opacity-0 group-hover/tooltip:opacity-100 transition-opacity",
          positionClasses[position]
        )}
      >
        {text}
      </div>
    </div>
  );
};

export default Tooltip;
