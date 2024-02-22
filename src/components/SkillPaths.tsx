import { memo, useMemo } from "react";

import { getLinesToDraw } from "../utils/utils";
import SkillPath from "./shared/SkillPath";

type PropsType = {
  lines?: [string, string][];
  color?: string;
};

const SkillPaths = ({ lines, color = "#251f36" }: PropsType) => {
  const defaultLines = useMemo(() => lines ?? getLinesToDraw(), [lines]);
  return (
    <>
      {defaultLines.map(([from, to]) => (
        <SkillPath key={`${from}-${to}`} from={from} to={to} color={color} />
      ))}
    </>
  );
};

export default memo(SkillPaths);
