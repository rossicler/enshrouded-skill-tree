import { DialogTitle } from "@headlessui/react";
import { useTranslation } from "next-i18next/pages";
import { GameButton, GameDialog, GamePanel } from "@enshrouded/react";

type PropsType = {
  open: boolean;
  onClose: () => void;
};

const SkillCapDialog = ({ open, onClose }: PropsType) => {
  const { t } = useTranslation("common");

  return (
    <GameDialog open={open} onClose={onClose} name="skill-cap" className="max-w-sm">
      <GamePanel>
        <div className="px-10 py-6">
          <DialogTitle
            as="h3"
            className="text-lg font-semibold leading-6 text-[#e8d5a3] drop-shadow-[0_0_4px_rgba(202,152,3,0.4)]"
          >
            {t("dialogs.skillCap.title")}
          </DialogTitle>
          <div className="mt-4 text-sm text-[#c0b89a]">
            <p>{t("dialogs.skillCap.message")}</p>
            <p className="mt-2 text-xs text-[#c0b89a]/60 italic">
              {t("dialogs.skillCap.hardcapHint")}
            </p>
          </div>
          <div className="mt-5 flex justify-end">
            <GameButton data-action="confirm" onClick={onClose}>
              {t("dialogs.skillCap.ok")}
            </GameButton>
          </div>
        </div>
      </GamePanel>
    </GameDialog>
  );
};

export default SkillCapDialog;
