import { Tooltip } from "react-tooltip";

import Nodes, { LinesAngles } from "../constants/Nodes";
import SkillNode from "./SkillNode";
import SkillPaths from "./SkillPaths";

const SkillTree = () => {
  return (
    <div className="relative scale-50 z-10">
      <Tooltip id="skill-tooltip" />
      <div className="absolute w-[400px] h-[400px] rounded-full border border-purple-400 border-opacity-30 bg-transparent -left-[200px] -bottom-[200px]" />
      {LinesAngles.map((lineAngle) => (
        <div
          className="absolute top-0 left-0 h-full"
          style={{
            transformOrigin: "0% 0%",
            transform: `rotate(${lineAngle}deg)`,
          }}
        >
          <div className={`relative mt-[198px] line-${lineAngle}`}>
            <div
              key={lineAngle}
              className="absolute w-2 h-2 rounded-full bg-purple-400 -left-1 -bottom-1 drop-shadow-shiny"
            />
          </div>
        </div>
      ))}
      {Nodes.nodes.map((skillNode) => (
        <SkillNode key={skillNode.id} node={skillNode} />
      ))}
      <SkillPaths />
    </div>
  );
};

export default SkillTree;
