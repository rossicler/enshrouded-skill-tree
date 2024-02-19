import React from "react";
import { Node } from "../constants/Nodes";

type PropsType = {
  node: Node;
};

const SIZE = {
  small: {
    className: "w-[30px] h-[30px]",
    size: 30,
  },
  medium: {
    className: "w-[40px] h-[40px]",
    size: 40,
  },
  large: {
    className: "w-[60px] h-[60px]",
    size: 60,
  },
};

const INIT_DISTANCE = 250;

const SkillNode = ({ node }: PropsType) => {
  const nodeSize = SIZE[node.tier ?? "small"];

  if (!node.angle) return null;

  return (
    <div
      className="absolute top-0 left-0 h-full"
      style={{
        transformOrigin: "0% 0%",
        transform: `rotate(${node.angle}deg)`,
      }}
    >
      <div
        className="relative w-0.5 h-0.5"
        style={{ marginTop: INIT_DISTANCE + (node.distance ?? 0) }}
      >
        <div
          className={`absolute rounded-full bg-gray-900 border border-yellow-700 ${nodeSize.className}`}
          style={{ left: -nodeSize.size / 2, bottom: -nodeSize.size / 2 }}
        />
      </div>
    </div>
  );
};

export default SkillNode;
