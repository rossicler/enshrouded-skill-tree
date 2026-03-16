import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import { ZoomOut, Crosshair, ZoomIn, Download, Upload, RotateCcw } from "lucide-react";

import { classNames } from "../../utils/utils";
import { playSound } from "../../utils/sounds";
import GameButton from "../shared/GameButton";
import GameButtonGroup from "../shared/GameButtonGroup";
import ImportDialog from "../dialogs/ImportDialog";
import { useAppDispatch } from "@/redux/hooks";
import {
  loadSelectedSkills,
  setCodeImported,
} from "@/redux/skills/skills.slice";
import PointsHUD from "./Points";
import AboutHUD from "./About";
import ExportDialog from "../dialogs/ExportDialog";
import Stats from "./Stats";
import { useRouter } from "next/router";
import SearchHUD from "./Search";

type PropsType = {
  zoomIn: (step?: number) => void;
  zoomOut: (step?: number) => void;
  centerView: (scale?: number) => void;
  zoomToElement: (node: HTMLElement | string, scale?: number, animationTime?: number, animationType?: "easeOut" | "linear" | "easeInQuad" | "easeOutQuad" | "easeInOutQuad" | "easeInCubic" | "easeOutCubic" | "easeInOutCubic" | "easeInQuart" | "easeOutQuart" | "easeInOutQuart" | "easeInQuint" | "easeOutQuint" | "easeInOutQuint") => void;
};

const HUD = ({ zoomIn, zoomOut, centerView, zoomToElement }: PropsType) => {
  let [importOpen, setImportOpen] = useState(false);
  let [exportOpen, setExportOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const { t } = useTranslation("common");
  const dispatch = useAppDispatch();
  const router = useRouter();

  const importHandler = (code: string) => {
    dispatch(setCodeImported(code));
  };

  const importSkillsHandler = (skills: string[]) => {
    dispatch(loadSelectedSkills(skills));
  };

  const clearHandler = () => {
    playSound("node-refund", 0.4);
    dispatch(loadSelectedSkills([]));
    router.replace("/", undefined, { shallow: true });
  };

  return (
    <>
      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={importHandler}
        onImportSkills={importSkillsHandler}
      />
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />

      {/* Search — always visible, full width on mobile */}
      <SearchHUD zoomToElement={zoomToElement} onFocusChange={setSearchFocused} />

      {/* Other HUD elements — hidden on mobile when search is focused */}
      <div className={searchFocused ? "hidden md:contents" : "contents"}>
        <div
          className={classNames(
            "absolute right-0 top-0 bg-transparent z-40 flex flex-row gap-3",
            "items-center py-6 px-6 top-14 md:top-0"
          )}
        >
          <GameButtonGroup>
            <GameButton grouped className="!min-w-0 !px-4 !pl-8 md:!min-w-[140px] md:!px-8 md:!pl-8" onClick={() => setImportOpen(true)}>
              <Download size={16} className="md:hidden" />
              <span className="hidden md:inline">{t("hud.import")}</span>
            </GameButton>
            <GameButton grouped className="!min-w-0 !px-4 md:!min-w-[140px] md:!px-8" onClick={() => setExportOpen(true)}>
              <Upload size={16} className="md:hidden" />
              <span className="hidden md:inline">{t("hud.export")}</span>
            </GameButton>
            <GameButton grouped className="!min-w-0 !px-4 !pr-8 md:!min-w-[140px] md:!px-8 md:!pr-8" onClick={clearHandler}>
              <RotateCcw size={16} className="md:hidden" />
              <span className="hidden md:inline">{t("hud.clear")}</span>
            </GameButton>
          </GameButtonGroup>
        </div>

        <div
          className={classNames(
            "absolute bottom-0 bg-transparent z-20",
            "flex items-center pb-6",
            "left-0 px-6 md:left-1/2 md:-translate-x-1/2 md:px-0"
          )}
        >
          {/* Mobile: reset view only */}
          <div className="md:hidden">
            <GameButton className="!min-w-0 !px-3" onClick={() => centerView(2)}>
              <Crosshair size={16} />
            </GameButton>
          </div>
          {/* Desktop: full zoom controls */}
          <div className="hidden md:block">
            <GameButtonGroup>
              <GameButton grouped className="!min-w-0 !px-4 !pl-8" onClick={() => zoomOut(0.5)}>
                <ZoomOut size={16} />
              </GameButton>
              <GameButton grouped className="!min-w-0 !px-4" onClick={() => centerView(2)}>
                <Crosshair size={16} />
              </GameButton>
              <GameButton grouped className="!min-w-0 !px-4 !pr-8" onClick={() => zoomIn(0.5)}>
                <ZoomIn size={16} />
              </GameButton>
            </GameButtonGroup>
          </div>
        </div>

        <PointsHUD />
        <AboutHUD />
      </div>
    </>
  );
};

export default HUD;
