import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useTranslation } from "next-i18next";
import GamePanel from "../shared/GamePanel";
import GameButton from "../shared/GameButton";

type PropsType = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const ResetConfirmDialog = ({ open, onConfirm, onCancel }: PropsType) => {
  const { t } = useTranslation("common");

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onCancel}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-sm transform overflow-visible text-left align-middle transition-all">
                <GamePanel>
                  <div className="px-10 py-6">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-[#e8d5a3] drop-shadow-[0_0_4px_rgba(202,152,3,0.4)]"
                    >
                      {t("dialogs.resetConfirm.title")}
                    </Dialog.Title>
                    <div className="mt-4 text-sm text-[#c0b89a]">
                      <p>{t("dialogs.resetConfirm.message")}</p>
                    </div>
                    <div className="mt-5 flex justify-end gap-3">
                      <GameButton variant="text" onClick={onCancel}>
                        {t("dialogs.resetConfirm.cancel")}
                      </GameButton>
                      <GameButton onClick={onConfirm}>
                        {t("dialogs.resetConfirm.confirm")}
                      </GameButton>
                    </div>
                  </div>
                </GamePanel>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ResetConfirmDialog;
