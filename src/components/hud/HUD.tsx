import React, { useState } from "react";

import { classNames } from "../../utils/utils";
import HUDButton from "../shared/HUDButton";
import ImportDialog from "../dialogs/ImportDialog";
import { useAppDispatch } from "@/redux/hooks";
import {
  loadSelectedSkills,
  setCodeImported,
} from "@/redux/skills/skills.slice";
import PointsHUD from "./Points";
import AboutHUD from "./About";
import ResetIcon from "../icons/Reset";
import ExportDialog from "../dialogs/ExportDialog";
import Stats from "./Stats";
import { useRouter } from "next/router";
import SearchHUD from "./Search";

type PropsType = {
  zoomIn: (step?: number) => void;
  zoomOut: (step?: number) => void;
  centerView: (scale?: number) => void;
};

const DISCORD_LINK = "https://discord.gg/saazEkNchu";

const HUD = ({ zoomIn, zoomOut, centerView }: PropsType) => {
  let [importOpen, setImportOpen] = useState(false);
  let [exportOpen, setExportOpen] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const importHandler = (code: string) => {
    // TODO: implement plastebin import
    dispatch(setCodeImported(code));
  };

  const clearHandler = () => {
    dispatch(loadSelectedSkills([]));
    router.replace("/", undefined, { shallow: true });
  };

  const openDiscordInvite = () => {
    window?.open(DISCORD_LINK, "_blank")?.focus();
  };

  return (
    <>
      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={importHandler}
      />
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
      <div
        className={classNames(
          "absolute right-0 top-0 w-32 bg-transparent z-40 flex flex-col gap-3",
          "justify-center items-center py-6 top-14 md:top-0"
        )}
      >
        <HUDButton onClick={() => setImportOpen(true)}>Import</HUDButton>
        <HUDButton onClick={() => setExportOpen(true)}>Export</HUDButton>
        <HUDButton onClick={clearHandler}>Clear</HUDButton>

        <HUDButton className="mt-5" onClick={openDiscordInvite}>
          Discord
        </HUDButton>
      </div>

      <div
        className={classNames(
          "absolute right-0 top-[50%] translate-y-[-50%] bg-transparent z-20 flex flex-col gap-3",
          "justify-center items-center px-6 bg-transparent"
        )}
      >
        <div
          className={classNames(
            "flex flex-col border border-purple-600 rounded-xl divide-y divide-purple-600",
            "bg-black"
          )}
        >
          <button className="h-12 w-8" onClick={() => zoomIn(0.5)}>
            +
          </button>
          <button className="h-12 w-8" onClick={() => zoomOut(0.5)}>
            -
          </button>
          <button
            className="h-12 w-8 flex justify-center items-center"
            onClick={() => centerView(2)}
          >
            <ResetIcon className="w-3" />
          </button>
        </div>
      </div>

      <SearchHUD />

      <PointsHUD />
      <AboutHUD />
    </>
  );
};

export default HUD;
