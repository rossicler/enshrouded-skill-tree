import { useState } from "react";
import { APP_VERSION } from "@/constants/version";
import { SKILL_TEXT_LOCALES, SKILL_TREE_GAME_BUILD, SKILL_TREE_REVISION, SKILL_TREE_UPDATE } from "@enshrouded/core";
import { DialogTitle } from "@headlessui/react";
import { useTranslation } from "next-i18next/pages";
import { useRouter } from "next/router";
import { classNames } from "@/utils/utils";
import { isSoundEnabled, setSoundEnabled, playSound } from "@/utils/sounds";
import { isHardcapEnabled, setHardcapEnabled } from "@/utils/settings";
import { GameDialog, GamePanel } from "@enshrouded/react";

type PropsType = {
  open: boolean;
  onClose: () => void;
};

const SettingsDialog = ({ open, onClose }: PropsType) => {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [soundOn, setSoundOn] = useState(isSoundEnabled);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [hardcapOn, setHardcapOn] = useState(isHardcapEnabled);

  const switchLocale = (locale: string) => {
    router.push(router.asPath, undefined, { locale, scroll: false });
  };

  const toggleHardcap = () => {
    const next = !hardcapOn;
    setHardcapOn(next);
    setHardcapEnabled(next);
    playSound("node-hover", 0.3);
  };

  const toggleSound = async () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      const played = await playSound("node-unlock", 0.4);
      setAudioBlocked(!played);
    } else {
      setAudioBlocked(false);
    }
  };

  return (
    <GameDialog open={open} onClose={onClose} name="settings" className="max-w-md">
      <GamePanel onClose={onClose}>
        <div className="px-10 py-6">
          <DialogTitle
            as="h3"
            className="text-lg font-semibold leading-6 text-[#e8d5a3] drop-shadow-[0_0_4px_rgba(202,152,3,0.4)]"
          >
            {t("dialogs.settings.title")}
          </DialogTitle>
          <div className="mt-5 flex items-center justify-between">
              <span className="text-sm text-[#c0b89a]">
                {t("dialogs.settings.hardcap")}
              </span>
              <button
                onClick={toggleHardcap}
                data-setting="hardcap"
                data-checked={hardcapOn ? "true" : "false"}
                onMouseEnter={() => playSound("node-hover", 0.3)}
                className={classNames(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  hardcapOn
                    ? "bg-[#C8B169]"
                    : "bg-[#5a5a60]"
                )}
              >
                <span
                  className={classNames(
                    "inline-block h-4 w-4 rounded-full bg-white transition-transform",
                    hardcapOn ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#c0b89a]">
                {t("dialogs.settings.sounds")}
              </span>
              <button
                onClick={toggleSound}
                data-setting="sound"
                data-checked={soundOn ? "true" : "false"}
                onMouseEnter={() => playSound("node-hover", 0.3)}
                className={classNames(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  soundOn
                    ? "bg-[#C8B169]"
                    : "bg-[#5a5a60]"
                )}
              >
                <span
                  className={classNames(
                    "inline-block h-4 w-4 rounded-full bg-white transition-transform",
                    soundOn ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
            {audioBlocked && (
              <p className="text-xs text-amber-400/80 leading-relaxed">
                {t("dialogs.settings.audioBlocked")}
              </p>
            )}
            <div className="flex items-center justify-between">
              <label htmlFor="settings-language" className="text-sm text-[#c0b89a]">
                {t("dialogs.settings.language")}
              </label>
              {/* Every language the game has, each named in itself. */}
              <select
                id="settings-language"
                data-setting="language"
                value={router.locale}
                onChange={(event) => switchLocale(event.target.value)}
                onMouseEnter={() => playSound("node-hover", 0.3)}
                className="rounded-sm border border-[#5a5a60] bg-[#35353a] px-2 py-1 text-sm font-semibold text-[#c0b89a] hover:bg-[#4a4a50] focus:outline-none focus:ring-1 focus:ring-[#C8B169]"
              >
                {SKILL_TEXT_LOCALES.map(({ code, name }) => (
                  <option key={code} value={code} lang={code}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-5 text-xs text-[#c0b89a]/60 text-right">
            <p>{t("dialogs.settings.treeVersion")}: {SKILL_TREE_UPDATE ? `${t("dialogs.settings.gameUpdate")} ${SKILL_TREE_UPDATE} · ` : ""}{t("dialogs.settings.gameBuild")} {SKILL_TREE_GAME_BUILD} · {SKILL_TREE_REVISION}</p>
            <p>{t("dialogs.settings.appVersion")}: v{APP_VERSION}</p>
          </div>
        </div>
      </GamePanel>
    </GameDialog>
  );
};

export default SettingsDialog;
