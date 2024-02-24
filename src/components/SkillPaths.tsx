import { memo, useMemo } from "react";

import { getBaseLinesToDraw, getLinesToDraw } from "../utils/utils";
import SkillPath from "./shared/SkillPath";

type PropsType = {
  lines?: [string, string][];
  color?: string;
};

const SkillPaths = ({ lines, color = "#251f36" }: PropsType) => {
  const defaultLines = useMemo(() => lines ?? getLinesToDraw(), [lines]);
  const baseLines = useMemo(() => (lines ? [] : getBaseLinesToDraw()), [lines]);

  return (
    <>
      {defaultLines.map(([from, to]) => (
        <SkillPath key={`${from}-${to}`} from={from} to={to} color={color} />
      ))}
      {!lines &&
        baseLines.map(([from, to]) => (
          <SkillPath
            key={`${from}-${to}`}
            from={from}
            to={to}
            color={color}
            prefixTo="line"
          />
        ))}
    </>
  );
};

export default memo(SkillPaths);
