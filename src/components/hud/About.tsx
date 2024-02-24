import React, { useState } from "react";
import { classNames } from "@/utils/utils";
import InfoIcon from "../icons/Info";
import HUDButton from "../shared/HUDButton";
import AboutDialog from "../dialogs/AboutDialog";

const About = () => {
  let [aboutOpen, setAboutOpen] = useState(false);

  return (
    <div
      className={classNames(
        "absolute right-0 bottom-0 bg-transparent z-40",
        "flex py-6 px-6 items-center"
      )}
    >
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <HUDButton className="w-fit" onClick={() => setAboutOpen(true)}>
        <div className="flex gap-1 items-center">
          <InfoIcon />
          About
        </div>
      </HUDButton>
    </div>
  );
};

export default About;
