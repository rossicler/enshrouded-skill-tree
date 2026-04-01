import { Fragment, useState } from "react";
import { APP_VERSION } from "@/constants/version";
import { Dialog, Transition } from "@headlessui/react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import GamePanel from "../shared/GamePanel";
import { classNames } from "@/utils/utils";
import { isSoundEnabled, setSoundEnabled, playSound } from "@/utils/sounds";

type PropsType = {
  open: boolean;
  onClose: () => void;
};

const SettingsDialog = ({ open, onClose }: PropsType) => {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [soundOn, setSoundOn] = useState(isSoundEnabled);
  const [audioBlocked, setAudioBlocked] = useState(false);

  const switchLocale = (locale: string) => {
    router.push(router.asPath, undefined, { locale, scroll: false });
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
                      {t("dialogs.settings.title")}
                    </Dialog.Title>
                    <div className="mt-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#c0b89a]">
                          {t("dialogs.settings.sounds")}
                        </span>
                        <button
                          onClick={toggleSound}
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
                        <span className="text-sm text-[#c0b89a]">
                          {t("dialogs.settings.language")}
                        </span>
                        <div className="flex rounded overflow-hidden border border-[#5a5a60]">
                          {["en", "fr"].map((locale) => (
                            <button
                              key={locale}
                              onClick={() => switchLocale(locale)}
                              onMouseEnter={() => playSound("node-hover", 0.3)}
                              className={classNames(
                                "px-3 py-1 text-sm font-semibold uppercase transition-colors",
                                router.locale === locale
                                  ? "bg-[#C8B169] text-black"
                                  : "bg-[#35353a] text-[#c0b89a] hover:bg-[#4a4a50]"
                              )}
                            >
                              {locale}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="mt-5 text-xs text-[#c0b89a]/50 text-right">v{APP_VERSION}</p>
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

export default SettingsDialog;
