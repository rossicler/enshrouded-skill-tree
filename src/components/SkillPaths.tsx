import React from "react";
import { getLinesToDraw } from "../utils/utils";
import LineTo from "react-lineto";

const SkillPaths = () => {
  return (
    <>
      {getLinesToDraw().map(([from, to]) => (
        <LineTo
          key={`${from}-${to}`}
          from={`node-${from}`}
          to={`node-${to}`}
          within="wrapper"
          borderColor="#1c1829"
          delay={100}
        />
      ))}
    </>
  );
};

export default SkillPaths;
