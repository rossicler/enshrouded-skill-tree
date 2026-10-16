import { FormEvent, useRef, useState } from "react";
import { gameToast } from "@/utils/gameToast";
import { DialogTitle } from "@headlessui/react";
import GameDialog from "../shared/GameDialog";
import { useTranslation } from "next-i18next/pages";
import { ChevronDown } from "lucide-react";
import GamePanel from "../shared/GamePanel";
import GameButton from "../shared/GameButton";
import GameInput from "../shared/GameInput";
import { classNames } from "@/utils/utils";

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
  const [advancedOpen, setAdvancedOpen] = useState(false);
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
    <GameDialog open={open} onClose={onClose} name="import" className="max-w-md">
      <GamePanel onClose={onClose}>
        <div className="px-10 py-6">
          <DialogTitle
            as="h3"
            className="text-lg font-semibold leading-6 text-[#e8d5a3] drop-shadow-[0_0_4px_rgba(202,152,3,0.4)]"
          >
            {t("dialogs.import.title")}
          </DialogTitle>

          <div className="mt-5 flex flex-col gap-3">
            {/* Advanced sharing accordion */}
            <div className="border-t border-white/10">
              <button
                onClick={() => setAdvancedOpen((v) => !v)}
                className="flex items-center justify-between w-full py-3 text-sm text-[#c0b89a] hover:text-[#e8d5a3] transition-colors"
              >
                {t("dialogs.advancedSharing")}
                <ChevronDown
                  size={16}
                  className={classNames(
                    "transition-transform duration-200",
                    advancedOpen && "rotate-180"
                  )}
                />
              </button>

              {advancedOpen && (
                dbAvailable ? (
                  <form className="flex flex-col gap-3 pb-2" onSubmit={importHandler}>
                    <label className="block text-sm text-[#c0b89a]">
                      {t("dialogs.import.urlLabel")}
                    </label>
                    <GameInput
                      variant="plain"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                    <p className="text-xs text-[#c0b89a]/60">
                      {t("dialogs.import.warning")}
                    </p>
                    <div className="flex justify-end gap-3">
                      <GameButton type="submit" disabled={!isValidUrl}>
                        {t("dialogs.import.import")}
                      </GameButton>
                      <GameButton onClick={importJSONHandler} type="button">
                        {t("dialogs.import.importJson")}
                      </GameButton>
                    </div>
                  </form>
                ) : (
                  <div className="flex justify-end pb-2">
                    <GameButton onClick={importJSONHandler}>
                      {t("dialogs.import.importJson")}
                    </GameButton>
                  </div>
                )
              )}
            </div>

            <div className="flex justify-end">
              <GameButton variant="text" onClick={onClose}>
                {t("dialogs.export.close")}
              </GameButton>
            </div>
          </div>
        </div>
      </GamePanel>
    </GameDialog>
  );
};

export default ImportDialog;
