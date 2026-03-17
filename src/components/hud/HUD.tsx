import React, { useState } from "react";
import { ZoomOut, Crosshair, ZoomIn, Download, Upload, RotateCcw } from "lucide-react";

import { classNames } from "../../utils/utils";
import { playSound } from "../../utils/sounds";
import GameButton from "../shared/GameButton";
import GameButtonGroup from "../shared/GameButtonGroup";
import ImportDialog from "../dialogs/ImportDialog";
import ResetConfirmDialog from "../dialogs/ResetConfirmDialog";
import { useAppDispatch } from "@/redux/hooks";
import {
  loadSelectedSkills,
  setCodeImported,
  initConnectedPaths,
} from "@/redux/skills/skills.slice";
import PointsHUD from "./Points";
import AboutHUD from "./About";
import ExportDialog from "../dialogs/ExportDialog";
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
  const [resetOpen, setResetOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const importHandler = (code: string) => {
    playSound("node-unlock", 0.4);
    dispatch(setCodeImported(code));
  };

  const importSkillsHandler = (skills: string[]) => {
    playSound("node-unlock", 0.4);
    dispatch(loadSelectedSkills(skills));
    dispatch(initConnectedPaths(skills));
  };

  const clearHandler = () => {
    playSound("node-refund", 0.4);
    dispatch(loadSelectedSkills([]));
    router.replace("/", undefined, { shallow: true });
    setResetOpen(false);
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
      <ResetConfirmDialog
        open={resetOpen}
        onConfirm={clearHandler}
        onCancel={() => setResetOpen(false)}
      />

      {/* Search — always visible, full width on mobile */}
      <SearchHUD zoomToElement={zoomToElement} onFocusChange={setSearchFocused} />

      {/* Other HUD elements — hidden on mobile when search is focused */}
      <div className={searchFocused ? "hidden md:contents" : "contents"}>
        <div
          className={classNames(
            "absolute right-0 top-0 bg-transparent z-40",
            "flex py-6 px-6 items-center",
            "top-14 md:top-0"
          )}
        >
          {/* Mobile: vertical */}
          <GameButtonGroup vertical className="md:hidden">
            <GameButton grouped className="!min-w-0 !px-4" onClick={() => setImportOpen(true)}>
              <Download size={16} />
            </GameButton>
            <GameButton grouped className="!min-w-0 !px-4" onClick={() => setExportOpen(true)}>
              <Upload size={16} />
            </GameButton>
            <GameButton grouped className="!min-w-0 !px-4" onClick={() => setResetOpen(true)}>
              <RotateCcw size={16} />
            </GameButton>
          </GameButtonGroup>
          {/* Desktop: horizontal, icon-only */}
          <GameButtonGroup className="hidden md:flex">
            <GameButton grouped className="!min-w-0 !px-4 !pl-8" onClick={() => setImportOpen(true)}>
              <Download size={16} />
            </GameButton>
            <GameButton grouped className="!min-w-0 !px-4" onClick={() => setExportOpen(true)}>
              <Upload size={16} />
            </GameButton>
            <GameButton grouped className="!min-w-0 !px-4 !pr-8" onClick={() => setResetOpen(true)}>
              <RotateCcw size={16} />
            </GameButton>
          </GameButtonGroup>
        </div>

        <div
          className={classNames(
            "absolute right-0 bg-transparent z-20",
            "flex items-center px-6",
            "bottom-[98px] md:bottom-0 md:pb-6"
          )}
        >
          {/* Mobile: vertical */}
          <GameButtonGroup vertical className="md:hidden">
            <GameButton grouped className="!min-w-0 !px-4" onClick={() => zoomIn(0.5)}>
              <ZoomIn size={16} />
            </GameButton>
            <GameButton grouped className="!min-w-0 !px-4" onClick={() => centerView(2)}>
              <Crosshair size={16} />
            </GameButton>
            <GameButton grouped className="!min-w-0 !px-4" onClick={() => zoomOut(0.5)}>
              <ZoomOut size={16} />
            </GameButton>
          </GameButtonGroup>
          {/* Desktop: horizontal */}
          <GameButtonGroup className="hidden md:flex">
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

        <PointsHUD />
        <AboutHUD />
      </div>
    </>
  );
};

export default HUD;
