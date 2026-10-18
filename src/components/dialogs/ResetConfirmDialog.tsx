import { DialogTitle } from "@headlessui/react";
import { useTranslation } from "next-i18next/pages";
import { GameButton, GameDialog, GamePanel } from "@enshrouded/react";

type PropsType = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const ResetConfirmDialog = ({ open, onConfirm, onCancel }: PropsType) => {
  const { t } = useTranslation("common");

  return (
    <GameDialog open={open} onClose={onCancel} name="reset-confirm" className="max-w-sm">
      <GamePanel>
        <div className="px-10 py-6">
          <DialogTitle
            as="h3"
            className="text-lg font-semibold leading-6 text-[#e8d5a3] drop-shadow-[0_0_4px_rgba(202,152,3,0.4)]"
          >
            {t("dialogs.resetConfirm.title")}
          </DialogTitle>
          <div className="mt-4 text-sm text-[#c0b89a]">
            <p>{t("dialogs.resetConfirm.message")}</p>
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <GameButton variant="text" data-action="cancel" onClick={onCancel}>
              {t("dialogs.resetConfirm.cancel")}
            </GameButton>
            <GameButton data-action="confirm" onClick={onConfirm}>
              {t("dialogs.resetConfirm.confirm")}
            </GameButton>
          </div>
        </div>
      </GamePanel>
    </GameDialog>
  );
};

export default ResetConfirmDialog;
