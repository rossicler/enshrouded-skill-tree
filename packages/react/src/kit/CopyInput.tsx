import { Check, Copy } from "lucide-react";

import { useUiText } from "../text";
import { classNames } from "./shared";

export type CopyInputProps = {
  value: string;
  // Shows the copied state (green border and a check mark).
  copied?: boolean;
  label?: string;
  // Called after the value is written to the clipboard: show a notice, set `copied`.
  onCopy?: () => void;
};

// A read-only field with a copy button.
export const CopyInput = ({ copied, value, label, onCopy }: CopyInputProps) => {
  const t = useUiText();
  const copyHandler = () => {
    navigator.clipboard?.writeText(value);
    onCopy?.();
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
          "w-full h-10 border rounded-xs",
          "py-1 px-2 flex items-center relative overflow-hidden",
          copied ? "border-[#8fad6a] bg-[#2a2a35]" : "border-[#5a5a60] bg-[#2a2a35]"
        )}
      >
        <input className="grow mr-8 bg-transparent text-[#e8d5a3] outline-hidden" value={value} disabled />
        <button
          type="button"
          aria-label={t("kit.copy")}
          className={classNames(
            "absolute right-0 w-8 h-full flex items-center justify-center border-l",
            copied ? "border-[#8fad6a]" : "border-[#5a5a60]"
          )}
          onClick={copyHandler}
        >
          {copied ? <Check size={16} className="text-[#8fad6a]" /> : <Copy size={16} className="text-[#e8d5a3]" />}
        </button>
      </div>
    </div>
  );
};
