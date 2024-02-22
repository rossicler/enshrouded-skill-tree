import React from "react";
import { classNames } from "../utils/utils";
import HUDButton from "./shared/HUDButton";

type PropsType = {
  onImport?: () => void;
  onExport?: () => void;
};

const HUD = ({ onImport, onExport }: PropsType) => {
  return (
    <div
      className={classNames(
        "absolute right-0 top-0 w-32 bg-transparent z-50 flex justify-center items-center py-6"
      )}
    >
      <HUDButton onClick={onImport}>Import</HUDButton>
      <HUDButton onClick={onExport}>Export</HUDButton>
    </div>
  );
};

export default HUD;
