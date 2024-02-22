import React, { ReactNode } from "react";
import { classNames } from "../../utils/utils";

type PropsType = {
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
} & JSX.IntrinsicElements["button"];

const HUDButton = ({ children, onClick, className, ...props }: PropsType) => {
  return (
    <button
      onClick={onClick}
      className={classNames(
        "py-1 px-2 rounded-lg border w-24 border-purple-600 text-sm hover:ring-1 hover:ring-purple-600",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default HUDButton;
