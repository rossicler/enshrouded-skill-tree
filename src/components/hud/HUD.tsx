import React, { useCallback, useState, type RefObject } from "react";
import { ZoomOut, Crosshair, ZoomIn, Share2, RotateCcw } from "lucide-react";

import { classNames } from "../../utils/utils";
import { playSound } from "../../utils/sounds";
import GameButton from "../shared/GameButton";
import GameButtonGroup from "../shared/GameButtonGroup";
import ResetConfirmDialog from "../dialogs/ResetConfirmDialog";
import { useAppDispatch } from "@/redux/hooks";
import { loadSelectedSkills } from "@/redux/skills/skills.slice";
import type { SkillBuild } from "@enshrouded/core";
import type { SkillTreeViewHandle } from "@enshrouded/react";
import { useLoadBuild } from "@/hooks/useLoadBuild";
import PointsHUD from "./Points";
import AboutHUD from "./About";
import BuildShareDialog from "../dialogs/BuildShareDialog";
import { useRouter } from "next/router";
import SearchHUD from "./Search";

type PropsType = {
  view: RefObject<SkillTreeViewHandle | null>;
  dbAvailable?: boolean;
  initialSearchText?: string;
};

const HUD = ({ view, dbAvailable = false, initialSearchText }: PropsType) => {
  const zoomIn = () => view.current?.zoomIn();
  const zoomOut = () => view.current?.zoomOut();
  const recenter = () => view.current?.center();
  const focusNode = useCallback(
    (nodeId: string) => view.current?.focusNode(nodeId, { showTooltip: true }),
    [view]
  );
  const [exportOpen, setExportOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const loadBuild = useLoadBuild();

  const importSkillsHandler = (build: SkillBuild) => {
    playSound("node-unlock", 0.4);
    loadBuild(build);
  };

  const clearHandler = () => {
    playSound("node-refund", 0.4);
    dispatch(loadSelectedSkills({}));
    router.replace("/", undefined, { shallow: true });
    setResetOpen(false);
  };

  return (
    <>
      <BuildShareDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onImportSkills={importSkillsHandler}
        dbAvailable={dbAvailable}
      />
      <ResetConfirmDialog
        open={resetOpen}
        onConfirm={clearHandler}
        onCancel={() => setResetOpen(false)}
      />

      {/* Search — always visible, full width on mobile */}
      <SearchHUD onFocusNode={focusNode} onFocusChange={setSearchFocused} initialSearchText={initialSearchText} />

      {/* Other HUD elements — hidden on mobile when search is focused */}
      <div className={searchFocused ? "hidden md:contents" : "contents"}>
        <div
          className={classNames(
            "absolute right-0 top-0 bg-transparent z-30",
            "flex py-6 px-6 max-[380px]:px-2 items-center",
            "top-14 max-[380px]:top-10 md:top-0"
          )}
        >
          {/* Mobile: vertical */}
          <GameButtonGroup vertical className="md:hidden">
            <GameButton grouped className="!min-w-0 !px-4" data-hud="share" onClick={() => setExportOpen(true)}>
              <Share2 size={16} />
            </GameButton>
            <GameButton grouped className="!min-w-0 !px-4" data-hud="reset" onClick={() => setResetOpen(true)}>
              <RotateCcw size={16} />
            </GameButton>
          </GameButtonGroup>
          {/* Desktop: horizontal, icon-only */}
          <GameButtonGroup className="hidden md:flex">
            <GameButton grouped className="!min-w-0 !px-4 !pl-8" data-hud="share" onClick={() => setExportOpen(true)}>
              <Share2 size={16} />
            </GameButton>
            <GameButton grouped className="!min-w-0 !px-4 !pr-8" data-hud="reset" onClick={() => setResetOpen(true)}>
              <RotateCcw size={16} />
            </GameButton>
          </GameButtonGroup>
        </div>

        <div
          className={classNames(
            "absolute right-0 bg-transparent z-30",
            "flex items-center px-6 max-[380px]:px-2",
            "bottom-[98px] max-[380px]:bottom-[114px] md:bottom-0 md:pb-6"
          )}
        >
          {/* Mobile: vertical */}
          <GameButtonGroup vertical className="md:hidden">
            <GameButton grouped className="!min-w-0 !px-4" data-hud="zoom-in" onClick={() => zoomIn()}>
              <ZoomIn size={16} />
            </GameButton>
            <GameButton grouped className="!min-w-0 !px-4" data-hud="recenter" onClick={() => recenter()}>
              <Crosshair size={16} />
            </GameButton>
            <GameButton grouped className="!min-w-0 !px-4" data-hud="zoom-out" onClick={() => zoomOut()}>
              <ZoomOut size={16} />
            </GameButton>
          </GameButtonGroup>
          {/* Desktop: horizontal */}
          <GameButtonGroup className="hidden md:flex">
            <GameButton grouped className="!min-w-0 !px-4 !pl-8" data-hud="zoom-out" onClick={() => zoomOut()}>
              <ZoomOut size={16} />
            </GameButton>
            <GameButton grouped className="!min-w-0 !px-4" data-hud="recenter" onClick={() => recenter()}>
              <Crosshair size={16} />
            </GameButton>
            <GameButton grouped className="!min-w-0 !px-4 !pr-8" data-hud="zoom-in" onClick={() => zoomIn()}>
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
