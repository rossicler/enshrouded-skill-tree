import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

import Nodes from "../constants/Nodes";
import SkillNode from "./SkillNode";

const SkillTree = () => {
  return (
    <div className="relative scale-50">
      <div className="absolute w-[400px] h-[400px] rounded-full border border-purple-500 bg-transparent -left-[200px] -bottom-[200px]" />
      {Nodes.nodes.map((skillNode) => (
        <SkillNode key={skillNode.id} node={skillNode} />
      ))}
    </div>
  );
};

export default SkillTree;
