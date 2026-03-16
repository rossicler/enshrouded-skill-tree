import { toast } from "react-toastify";
import { CircleCheck, CircleX } from "lucide-react";

const GameToast = ({
  message,
  type,
}: {
  message: string;
  type: "success" | "error";
}) => (
  <div className="flex items-center gap-2">
    {type === "success" ? (
      <CircleCheck size={18} className="text-[#8fad6a] shrink-0" />
    ) : (
      <CircleX size={18} className="text-[#c45c5c] shrink-0" />
    )}
    <span className="text-sm text-[#e8d5a3]">{message}</span>
  </div>
);

export const gameToast = {
  success: (message: string) =>
    toast(<GameToast message={message} type="success" />, {
      className:
        "!bg-[#2a2a35] !border !border-[#5a5a60]/50 !border-t-[#b8941f]/60 !rounded-sm !shadow-[0_3px_6px_rgba(0,0,0,0.4)]",
      closeButton: false,
      autoClose: 2500,
    }),
  error: (message: string) =>
    toast(<GameToast message={message} type="error" />, {
      className:
        "!bg-[#2a2a35] !border !border-[#5a5a60]/50 !border-t-[#c45c5c]/60 !rounded-sm !shadow-[0_3px_6px_rgba(0,0,0,0.4)]",
      closeButton: false,
      autoClose: 3500,
    }),
};
