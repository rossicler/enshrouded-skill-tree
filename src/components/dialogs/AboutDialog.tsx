import { DialogTitle } from "@headlessui/react";
import GameDialog from "../shared/GameDialog";
import { Trans, useTranslation } from "next-i18next/pages";
import GamePanel from "../shared/GamePanel";
import GameButton from "../shared/GameButton";

type PropsType = {
  open: boolean;
  onClose: () => void;
};

const AboutDialog = ({ open, onClose }: PropsType) => {
  const { t } = useTranslation("common");

  return (
    <GameDialog open={open} onClose={onClose} name="about" className="max-w-md">
      <GamePanel onClose={onClose}>
        <div className="px-10 py-6">
          <DialogTitle
            as="h3"
            className="text-lg font-semibold leading-6 text-[#e8d5a3] drop-shadow-[0_0_4px_rgba(202,152,3,0.4)]"
          >
            {t("dialogs.about.title")}
          </DialogTitle>
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
              <GameButton variant="text" onClick={onClose}>
                {t("dialogs.about.close")}
              </GameButton>
            </div>
          </div>
        </div>
      </GamePanel>
    </GameDialog>
  );
};

export default AboutDialog;
