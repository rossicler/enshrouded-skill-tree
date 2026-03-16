import React from "react";
import { useTranslation } from "next-i18next";
import { Copy, Check } from "lucide-react";

import { classNames } from "@/utils/utils";
import { gameToast } from "@/utils/gameToast";

type PropsType = {
  copied?: boolean;
  value: string;
  label?: string;
  onCopy?: () => void;
};

const CopyInput = ({ copied, value, label, onCopy }: PropsType) => {
  const { t } = useTranslation("common");
  const copyHandler = () => {
    navigator.clipboard.writeText(value);
    gameToast.success(t("toasts.shareUrlCopied"));
    if (onCopy) onCopy();
  };

  return (
    <div className="flex flex-col gap-1 text-[#c0b89a]">
      {label && (
        <div>
          <span>{label}</span>
        </div>
      )}
      <div
        className={classNames(
          "w-full h-10 border rounded-sm",
          "py-1 px-2 flex items-center relative overflow-hidden",
          copied
            ? "border-[#8fad6a] bg-[#2a2a35]"
            : "border-[#5a5a60] bg-[#2a2a35]"
        )}
      >
        <input className="flex-grow mr-8 bg-transparent text-[#e8d5a3] outline-none" value={value} disabled />
        <button
          className={classNames(
            "absolute right-0 w-8 h-full flex items-center justify-center border-l",
            copied ? "border-[#8fad6a]" : "border-[#5a5a60]"
          )}
          onClick={copyHandler}
        >
          {copied ? (
            <Check size={16} className="text-[#8fad6a]" />
          ) : (
            <Copy size={16} className="text-[#e8d5a3]" />
          )}
        </button>
      </div>
    </div>
  );
};

export default CopyInput;
