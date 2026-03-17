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
        "absolute left-0 bg-transparent z-40",
        "flex px-6 items-center gap-3",
        "bottom-[98px] md:bottom-0 md:py-6"
      )}
    >
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      {/* Mobile: vertical */}
      <GameButtonGroup vertical className="md:hidden">
        <GameButton grouped className="!min-w-0 !px-4" onClick={openDiscordInvite}>
          <MessageCircle size={16} />
        </GameButton>
        <GameButton grouped className="!min-w-0 !px-4" onClick={() => setAboutOpen(true)}>
          <Info size={16} />
        </GameButton>
        <GameButton grouped className="!min-w-0 !px-4" onClick={() => setSettingsOpen(true)}>
          <Settings size={16} />
        </GameButton>
      </GameButtonGroup>
      {/* Desktop: horizontal — reversed order (settings on left/outside) */}
      <GameButtonGroup className="hidden md:flex">
        <GameButton
          grouped
          className="!min-w-0 !px-4 !pl-8"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings size={18} />
        </GameButton>
        <GameButton grouped className="!min-w-[140px] !px-8" onClick={() => setAboutOpen(true)}>
          {t("hud.about")}
        </GameButton>
        <GameButton grouped className="!min-w-[140px] !px-8 !pr-8" onClick={openDiscordInvite}>
          {t("hud.discord")}
        </GameButton>
      </GameButtonGroup>
    </div>
  );
};

export default About;
