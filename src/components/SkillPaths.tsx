import { memo, useCallback, useMemo } from "react";

import { getBaseLinesToDraw, getLinesToDraw } from "../utils/utils";
import SkillPath from "./shared/SkillPath";

type PropsType = {
  lines?: [string, string][];
  color?: string;
};

const DEFAULT_COLOR = "#251f36";
const CONNECTED_COLOR = "#56422b";

const SkillPaths = ({ lines, color = "#251f36" }: PropsType) => {
  const defaultLines = useMemo(() => getLinesToDraw(), []);
  const baseLines = useMemo(() => getBaseLinesToDraw(), []);

  const isConnected = useCallback(
    (from: string, to: string) =>
      lines && lines.some((arr) => arr.includes(to) && arr.includes(from)),
    [lines]
  );

  return (
    <>
      {defaultLines.map(([from, to]) => (
        <SkillPath
          key={`${from}-${to}`}
          from={from}
          to={to}
          color={isConnected(from, to) ? CONNECTED_COLOR : DEFAULT_COLOR}
        />
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
