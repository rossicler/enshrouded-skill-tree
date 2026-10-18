import { useEffect, useMemo, useRef, useState } from "react";
import { gameToast } from "@/utils/gameToast";
import { DialogTitle } from "@headlessui/react";
import { useTranslation } from "next-i18next/pages";
import { ChevronDown } from "lucide-react";

import {
  BIOMES,
  MAX_PLAYER_LEVEL,
  SkillBuild,
  encodeSkillBuild,
  isDifferentTreeVersion,
  parseSkillBuild,
  selectionToBuild,
} from "@enshrouded/core";
import { useAppSelector } from "@/redux/hooks";
import { classNames } from "@/utils/utils";
import { CopyInput, GameButton, GameDialog, GamePanel } from "@enshrouded/react";

type PropsType = {
  open: boolean;
  onClose: () => void;
  onImportSkills: (build: SkillBuild) => void;
  dbAvailable?: boolean;
};

const BASE_URL =
  process.env.BASE_URL || "https://enshrouded-skill-tree.vercel.app/";

const BuildShareDialog = ({ open, onClose, onImportSkills, dbAvailable = false }: PropsType) => {
  const [shortURL, setShortURL] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [copied, setCopied] = useState("");
  const [loading, setLoading] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation("common");
  const selectedSkills = useAppSelector((state) => state.skill.selectedSkills);
  const playerLevel = useAppSelector((state) => state.skill.playerLevel ?? MAX_PLAYER_LEVEL);
  const unlockedBiomes = useAppSelector((state) => state.skill.unlockedBiomes ?? BIOMES.map((b) => b.id));

  const selectedSkillIds = useMemo(
    () => Object.keys(selectedSkills),
    [selectedSkills]
  );
  const buildData: SkillBuild = useMemo(
    () => selectionToBuild(selectedSkills, { playerLevel, unlockedBiomes }),
    [selectedSkills, playerLevel, unlockedBiomes]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        // Old files are a plain string[]; newer ones are a SkillBuild.
        const build = parseSkillBuild(JSON.parse(event.target?.result as string));
        if (!build) {
          gameToast.error(t("toasts.invalidCode"));
          return;
        }
        onImportSkills(build);
        gameToast.success(t("toasts.buildImported", { name: file.name.replace(/\.json$/i, "") }));
        if (isDifferentTreeVersion(build)) gameToast.warning(t("toasts.differentTreeVersion"));
        onClose();
      } catch {
        gameToast.error(t("toasts.invalidCode"));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const exportAPIHandler = async () => {
    setLoading(true);
    try {
      const tmpCode = encodeSkillBuild(buildData);
      const response = await fetch("/api/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: tmpCode }),
      });
      const result = await response.json();
      const url = `${BASE_URL}?shortCode=${result.code}`;
      setShortCode(result.code);
      setShortURL(url);
      navigator.clipboard.writeText(url);
      gameToast.success(t("toasts.shareUrlCopied"));
      setCopied("url");
    } finally {
      setLoading(false);
    }
  };

  const downloadJSON = () => {
    const name = shortCode || "enshrouded-build";
    const json = JSON.stringify(buildData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  useEffect(() => {
    if (open) {
      if (dbAvailable) {
        if (selectedSkillIds.length > 0 && !shortURL) exportAPIHandler();
      } else {
        setAdvancedOpen(true);
      }
    } else {
      setShortURL("");
      setShortCode("");
      setCopied("");
      setAdvancedOpen(false);
    }
  }, [open]);

  return (
    <GameDialog open={open} onClose={onClose} name="share" className="max-w-md">
      <GamePanel onClose={onClose}>
        <div className="px-10 py-6">
          <DialogTitle
            as="h3"
            className="text-lg font-semibold leading-6 text-[#e8d5a3] drop-shadow-[0_0_4px_rgba(202,152,3,0.4)]"
          >
            {t("dialogs.export.title")}
          </DialogTitle>

          <div className="mt-5 flex flex-col gap-3">
            {!dbAvailable && (
              <p className="text-sm text-amber-400/80 italic">
                {t("dialogs.export.dbUnavailable")}
              </p>
            )}
            {dbAvailable && (
              selectedSkillIds.length === 0 ? (
                <p className="text-sm text-[#c0b89a] italic">
                  {t("dialogs.export.noSkills")}
                </p>
              ) : loading ? (
                <div className="text-sm text-[#c0b89a]">
                  {t("dialogs.export.generating")}
                </div>
              ) : shortURL ? (
                <CopyInput
                  label={t("dialogs.export.shortUrl")}
                  copied={copied === "url"}
                  onCopy={() => {
                    gameToast.success(t("toasts.shareUrlCopied"));
                    setCopied("url");
                  }}
                  value={shortURL}
                />
              ) : null
            )}

            {/* Advanced sharing accordion */}
            <div className="mt-2 border-t border-white/10">
              <button
                data-action="toggle-advanced"
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
                <div className="flex flex-col gap-3 pb-2">
                  <div className="flex gap-3">
                    <GameButton className="flex-1" data-action="import-json" onClick={() => fileInputRef.current?.click()}>
                      {t("dialogs.import.importJson")}
                    </GameButton>
                    <GameButton className="flex-1" data-action="export-json" onClick={downloadJSON} disabled={selectedSkillIds.length === 0}>
                      {t("dialogs.export.exportJson")}
                    </GameButton>
                  </div>
                  <p className="text-sm text-[#c0b89a] italic">
                    {t("dialogs.import.warning")}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    data-action="import-file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </GamePanel>
    </GameDialog>
  );
};

export default BuildShareDialog;
