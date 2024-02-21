import { memo, useMemo } from "react";
import LineTo from "react-lineto";

import { getLinesToDraw } from "../utils/utils";

type PropsType = {
  lines?: [string, string][];
  color?: string;
};

const SkillPath = memo(
  ({ from, to, color }: { from: string; to: string; color: string }) => (
    <LineTo
      from={`node-${from}`}
      to={`node-${to}`}
      within="wrapper"
      borderColor={color}
      delay={100}
    />
  )
);

const SkillPaths = ({ lines, color = "#1c1829" }: PropsType) => {
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
