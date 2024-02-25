import { memo, useCallback, useMemo } from "react";

import { getBaseLinesToDraw, getLinesToDraw } from "../utils/utils";
import SkillPath from "./shared/SkillPath";
import { useAppSelector } from "@/redux/hooks";

type PropsType = {
  lines?: [string, string][];
};

const DEFAULT_COLOR = "#251f36";
const CONNECTED_COLOR = "#8e6d08";

const SkillPaths = ({ lines }: PropsType) => {
  const defaultLines = useMemo(() => getLinesToDraw(), []);
  const baseLines = useMemo(() => getBaseLinesToDraw(), []);
  const skillsSelected = useAppSelector((state) => state.skill.selectedSkills);

  const isConnected = useCallback(
    (from: string, to: string) =>
      lines && lines.some((arr) => arr.includes(to) && arr.includes(from)),
    [lines]
  );

  const isBaseConnected = useCallback(
    (id: string) => skillsSelected.includes(id),
    [skillsSelected]
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
      {baseLines.map(([from, to]) => (
        <SkillPath
          key={`${from}-${to}`}
          from={from}
          to={to}
          color={isBaseConnected(from) ? CONNECTED_COLOR : DEFAULT_COLOR}
          prefixTo="line"
        />
      ))}
    </>
  );
};

export default memo(SkillPaths);
