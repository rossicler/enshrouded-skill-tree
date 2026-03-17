import { FormEvent, Fragment, useRef, useState } from "react";
import { gameToast } from "@/utils/gameToast";
import { Dialog, Transition } from "@headlessui/react";
import { useTranslation } from "next-i18next";
import GamePanel from "../shared/GamePanel";
import GameButton from "../shared/GameButton";
import GameInput from "../shared/GameInput";

type PropsType = {
  open: boolean;
  onClose: () => void;
  onImport: (code: string) => void;
  onImportSkills: (skills: string[]) => void;
  dbAvailable?: boolean;
};

const CODE_ARG = "code=";

const ImportDialog = ({ open, onClose, onImport, onImportSkills, dbAvailable = false }: PropsType) => {
  const [url, setUrl] = useState("");
  const isValidUrl = /^https?:\/\/.+\..+/.test(url.trim());
  const { t } = useTranslation("common");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importHandler = (e: FormEvent) => {
    e.preventDefault();

    let code = "";
    if (url.includes(CODE_ARG)) {
      const idx = url.indexOf(CODE_ARG);
      code = url.substring(idx + CODE_ARG.length);
    }

    if (code) {
      onImport(code);
      setUrl("");
      onClose();
    } else {
      gameToast.error(t("toasts.invalidUrl"));
    }
  };

  const importJSONHandler = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const skills = JSON.parse(event.target?.result as string);
        if (Array.isArray(skills) && skills.every((s) => typeof s === "string")) {
          onImportSkills(skills);
          onClose();
        } else {
          gameToast.error(t("toasts.invalidCode"));
        }
      } catch {
        gameToast.error(t("toasts.invalidCode"));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-md transform overflow-visible text-left align-middle transition-all">
                <GamePanel onClose={onClose}>
                  <div className="px-10 py-6">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-[#e8d5a3] drop-shadow-[0_0_4px_rgba(202,152,3,0.4)]"
                    >
                      {t("dialogs.import.title")}
                    </Dialog.Title>
                    {dbAvailable ? (
                      <form className="mt-5" onSubmit={importHandler}>
                        <label className="block text-sm text-[#c0b89a] mb-1">
                          {t("dialogs.import.urlLabel")}
                        </label>
                        <GameInput
                          variant="plain"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                        />

                        <p className="mt-3 text-xs text-[#c0b89a]/60">
                          {t("dialogs.import.warning")}
                        </p>
                        <div className="mt-4 flex justify-end gap-3">
                          <GameButton type="submit" disabled={!isValidUrl}>
                            {t("dialogs.import.import")}
                          </GameButton>
                          <GameButton onClick={importJSONHandler} type="button">
                            {t("dialogs.import.importJson")}
                          </GameButton>
                        </div>
                      </form>
                    ) : (
                      <div className="mt-5 flex justify-end">
                        <GameButton onClick={importJSONHandler}>
                          {t("dialogs.import.importJson")}
                        </GameButton>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleFileChange}
                    />
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

export default ImportDialog;
