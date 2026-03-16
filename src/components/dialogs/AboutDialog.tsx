import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Trans, useTranslation } from "next-i18next";
import GamePanel from "../shared/GamePanel";
import GameButton from "../shared/GameButton";

type PropsType = {
  open: boolean;
  onClose: () => void;
};

const AboutDialog = ({ open, onClose }: PropsType) => {
  const { t } = useTranslation("common");

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
                      {t("dialogs.about.title")}
                    </Dialog.Title>
                    <div className="mt-5 text-[#c0b89a] flex flex-col gap-5 [&_a]:text-[#e8d5a3] [&_a]:underline [&_a]:hover:text-[#f0e0b5]">
                      <p>{t("dialogs.about.description1")}</p>
                      <p>
                        <Trans
                          i18nKey="dialogs.about.description2"
                          ns="common"
                          t={t}
                          components={{
                            githubLink: (
                              <a
                                href="https://github.com/rossicler/enshrouded-skill-tree"
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            ),
                            discordLink: (
                              <a
                                href="https://discord.gg/pEeZwqaWyj"
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            ),
                          }}
                        />
                      </p>
                      <p>
                        <Trans
                          i18nKey="dialogs.about.description3"
                          ns="common"
                          t={t}
                          components={{
                            glitchizLink: (
                              <a
                                href="https://www.youtube.com/@Glitchiz"
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            ),
                          }}
                        />
                      </p>

                      <div className="w-full flex justify-end">
                        <GameButton onClick={onClose}>
                          {t("dialogs.about.close")}
                        </GameButton>
                      </div>
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

export default AboutDialog;
