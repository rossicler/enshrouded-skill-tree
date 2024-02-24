import React, { useState } from "react";

import { classNames, convertJsonToHash } from "../../utils/utils";
import HUDButton from "../shared/HUDButton";
import ImportDialog from "../dialogs/ImportDialog";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  loadSelectedSkills,
  setCodeImported,
} from "@/redux/skills/skills.slice";
import { toast } from "react-toastify";
import PointsHUD from "./Points";
import AboutHUD from "./About";
import ResetIcon from "../icons/Reset";

type PropsType = {
  zoomIn: (step?: number) => void;
  zoomOut: (step?: number) => void;
};

const DISCORD_LINK = "https://discord.gg/saazEkNchu";

const HUD = ({ zoomIn, zoomOut }: PropsType) => {
  let [importOpen, setImportOpen] = useState(false);
  const selectedSkills = useAppSelector((state) => state.skill.selectedSkills);
  const dispatch = useAppDispatch();

  const importHandler = (code: string) => {
    // TODO: implement plastebin import
    dispatch(setCodeImported(code));
  };

  const exportHandler = () => {
    const code = convertJsonToHash(selectedSkills);
    navigator.clipboard.writeText(code);
    toast.success("Code copied successfully");
  };

  const clearHandler = () => {
    dispatch(loadSelectedSkills([]));
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
      <div
        className={classNames(
          "absolute right-0 top-0 w-32 bg-transparent z-40 flex flex-col gap-3",
          "justify-center items-center py-6"
        )}
      >
        <HUDButton onClick={() => setImportOpen(true)}>Import</HUDButton>
        <HUDButton onClick={exportHandler}>Export</HUDButton>
        <HUDButton onClick={clearHandler}>Clear</HUDButton>

        <HUDButton className="mt-5" onClick={openDiscordInvite}>
          Discord
        </HUDButton>
      </div>

      <div
        className={classNames(
          "absolute top-0 left-0 w-full bg-transparent z-40 flex flex-col gap-3",
          "justify-center items-center py-6 bg-transparent"
        )}
      >
        <div
          className={classNames(
            "flex border border-purple-600 rounded-xl px-2 divide-x divide-purple-600"
          )}
        >
          <button className="w-12" onClick={() => zoomIn(0.5)}>
            +
          </button>
          <button className="w-12" onClick={() => zoomOut(0.5)}>
            -
          </button>
          <button
            className="w-12 flex justify-center items-center"
            onClick={() => zoomOut(5)}
          >
            <ResetIcon className="w-3" />
          </button>
        </div>
      </div>

      <PointsHUD />
      <AboutHUD />
    </>
  );
};

export default HUD;
