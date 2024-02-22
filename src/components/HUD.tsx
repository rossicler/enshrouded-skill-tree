import React, { useState } from "react";
import { classNames, convertJsonToHash } from "../utils/utils";
import HUDButton from "./shared/HUDButton";
import ImportDialog from "./dialogs/ImportDialog";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  loadSelectedSkills,
  setCodeImported,
} from "@/redux/skills/skills.slice";

const HUD = () => {
  let [importOpen, setImportOpen] = useState(false);
  const selectedSkills = useAppSelector((state) => state.skill.selectedSkills);
  const dispatch = useAppDispatch();

  const importHandler = (code: string) => {
    // TODO: implement plastebin import
    dispatch(setCodeImported(code));
  };

  const exportHandler = () => {
    console.log(convertJsonToHash(selectedSkills));
  };

  const clearHandler = () => {
    dispatch(loadSelectedSkills([]));
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
          "absolute right-0 top-0 w-32 bg-transparent z-50 flex flex-col gap-3",
          "justify-center items-center py-6"
        )}
      >
        <HUDButton onClick={() => setImportOpen(true)}>Import</HUDButton>
        <HUDButton onClick={exportHandler}>Export</HUDButton>
        <HUDButton onClick={clearHandler}>Clear</HUDButton>
      </div>
    </>
  );
};

export default HUD;
