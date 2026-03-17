import { Fragment, useEffect, useState } from "react";
import { gameToast } from "@/utils/gameToast";
import { Dialog, Transition } from "@headlessui/react";
import { useTranslation } from "next-i18next";

import { convertJsonToHash } from "@/utils/utils";
import { useAppSelector } from "@/redux/hooks";
import CopyInput from "../shared/CopyInput";
import GamePanel from "../shared/GamePanel";
import GameButton from "../shared/GameButton";
import GameInput from "../shared/GameInput";

type PropsType = {
  open: boolean;
  onClose: () => void;
};

const BASE_URL =
  process.env.BASE_URL || "https://enshrouded-skill-tree.vercel.app/";

const ExportDialog = ({ open, onClose }: PropsType) => {
  const [shortURL, setShortURL] = useState("");
  const [copied, setCopied] = useState("");
  const [loading, setLoading] = useState(false);
  const [showJsonExport, setShowJsonExport] = useState(false);
  const [buildName, setBuildName] = useState("enshrouded-build");
  const { t } = useTranslation("common");
  const selectedSkills = useAppSelector((state) => state.skill.selectedSkills);

  const exportAPIHandler = async () => {
    setLoading(true);
    try {
      const tmpCode = convertJsonToHash(selectedSkills);
      const response = await fetch("/api/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: tmpCode }),
      });
      const result = await response.json();
      const url = `${BASE_URL}?shortCode=${result.code}`;
      setShortURL(url);
      navigator.clipboard.writeText(url);
      gameToast.success(t("toasts.shareUrlCopied"));
      setCopied("url");
    } finally {
      setLoading(false);
    }
  };

  const downloadJSON = () => {
    const name = buildName.trim() || "enshrouded-build";
    const json = JSON.stringify(selectedSkills, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowJsonExport(false);
    onClose();
  };

  useEffect(() => {
    if (open) {
      if (shortURL) return;
      if (selectedSkills.length === 0) {
        gameToast.error(t("toasts.noSkillsAllocated"));
        onClose();
      } else {
        exportAPIHandler();
      }
    } else {
      setShortURL("");
      setCopied("");
      setShowJsonExport(false);
      setBuildName("enshrouded-build");
    }
  }, [open]);

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
                      {showJsonExport
                        ? t("dialogs.export.exportJsonTitle")
                        : t("dialogs.export.title")}
                    </Dialog.Title>

                    {showJsonExport ? (
                      <div className="mt-5 flex flex-col gap-3">
                        <label className="block text-sm text-[#c0b89a]">
                          {t("dialogs.export.buildName")}
                        </label>
                        <GameInput
                          variant="plain"
                          value={buildName}
                          onChange={(e) => setBuildName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              downloadJSON();
                            }
                          }}
                          autoFocus
                        />
                        <div className="mt-2 w-full flex justify-end gap-3">
                          <GameButton variant="text" onClick={() => setShowJsonExport(false)}>
                            {t("dialogs.refundConfirm.cancel")}
                          </GameButton>
                          <GameButton onClick={downloadJSON}>
                            {t("dialogs.export.download")}
                          </GameButton>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 flex flex-col gap-3">
                        {loading ? (
                          <div className="text-sm text-[#c0b89a]">
                            {t("dialogs.export.generating")}
                          </div>
                        ) : shortURL ? (
                          <CopyInput
                            label={t("dialogs.export.shortUrl")}
                            copied={copied === "url"}
                            onCopy={() => setCopied("url")}
                            value={shortURL}
                          />
                        ) : null}

                        <div className="mt-4 w-full flex justify-end gap-3">
                          <GameButton variant="text" onClick={onClose}>
                            {t("dialogs.export.close")}
                          </GameButton>
                          <GameButton onClick={() => setShowJsonExport(true)}>
                            {t("dialogs.export.exportJson")}
                          </GameButton>
                        </div>
                      </div>
                    )}
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

export default ExportDialog;
