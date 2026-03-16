import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import { Settings, MessageCircle, Info } from "lucide-react";
import { classNames } from "@/utils/utils";
import GameButton from "../shared/GameButton";
import GameButtonGroup from "../shared/GameButtonGroup";
import AboutDialog from "../dialogs/AboutDialog";
import SettingsDialog from "../dialogs/SettingsDialog";

const DISCORD_LINK = "https://discord.gg/saazEkNchu";

const About = () => {
  const { t } = useTranslation("common");
  let [aboutOpen, setAboutOpen] = useState(false);
  let [settingsOpen, setSettingsOpen] = useState(false);

  const openDiscordInvite = () => {
    window?.open(DISCORD_LINK, "_blank")?.focus();
  };

  return (
    <div
      className={classNames(
        "absolute right-0 bottom-0 bg-transparent z-40",
        "flex py-6 px-6 items-center gap-3"
      )}
    >
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <GameButtonGroup>
        <GameButton grouped className="!min-w-0 !px-4 !pl-8 md:!min-w-[140px] md:!px-8 md:!pl-8" onClick={openDiscordInvite}>
          <MessageCircle size={16} className="md:hidden" />
          <span className="hidden md:inline">{t("hud.discord")}</span>
        </GameButton>
        <GameButton grouped className="!min-w-0 !px-4 md:!min-w-[140px] md:!px-8" onClick={() => setAboutOpen(true)}>
          <Info size={16} className="md:hidden" />
          <span className="hidden md:inline">{t("hud.about")}</span>
        </GameButton>
        <GameButton
          grouped
          className="!min-w-0 !px-4 !pr-8"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings size={18} />
        </GameButton>
      </GameButtonGroup>
    </div>
  );
};

export default About;
