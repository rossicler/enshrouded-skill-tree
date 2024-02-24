import React from "react";

import { classNames } from "@/utils/utils";
import CopyCheckIcon from "../icons/CopyCheck";
import CopyIcon from "../icons/Copy";
import { toast } from "react-toastify";

type PropsType = {
  copied?: boolean;
  value: string;
  label?: string;
  onCopy?: () => void;
};

const CopyInput = ({ copied, value, label, onCopy }: PropsType) => {
  const copyHandler = () => {
    navigator.clipboard.writeText(value);
    toast.success("Share URL copied successfully");
    if (onCopy) onCopy();
  };

  return (
    <div className="flex flex-col gap-1 text-black">
      {label && (
        <div>
          <span>{label}</span>
        </div>
      )}
      <div
        className={classNames(
          "w-full h-10 border rounded-lg",
          "py-1 px-2 flex items-center relative overflow-hidden",
          copied
            ? "border-green-600 outline-green-600"
            : "border-purple-600 outline-purple-600"
        )}
      >
        <input className="flex-grow mr-8" value={value} disabled />
        <button
          className={classNames(
            "absolute right-0 w-8 h-full flex items-center justify-center border-l",
            copied ? "border-green-600" : "border-purple-600"
          )}
          onClick={copyHandler}
        >
          {copied ? (
            <CopyCheckIcon className="w-4 text-green-600" />
          ) : (
            <CopyIcon className="w-4 text-purple-600" />
          )}
        </button>
      </div>
    </div>
  );
};

export default CopyInput;
