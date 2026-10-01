import SkillNodes, { LinesAngles } from "../constants/Nodes";
import { resolveBaseAnchor } from "../utils/nodePosition";

const CoreCircle = () => {
  return (
    <>
      <div className="absolute w-[400px] h-[400px] rounded-full border border-purple-400 border-opacity-30 bg-transparent -left-[200px] -bottom-[200px]" />
      {LinesAngles.map((lineAngle) => (
        <div
          key={lineAngle}
          className="absolute top-0 left-0 h-full"
          style={{
            transformOrigin: "0% 0%",
            transform: `rotate(${lineAngle}deg)`,
          }}
        >
          <div className={`relative mt-[198px]`}>
            <div
              key={lineAngle}
              className="absolute w-2 h-2 rounded-full bg-purple-400 -left-1 -bottom-1 drop-shadow-shiny"
            />
          </div>
        </div>
      ))}
      {Object.values(SkillNodes.nodes)
        .filter((node) => node.base)
        .map((node) => {
          const anchor = resolveBaseAnchor(node);
          return (
            <div
              key={node.id}
              id={`line-base-${node.id}`}
              className="absolute w-0 h-0"
              style={{ left: anchor.x, top: anchor.y }}
            />
          );
        })}
    </>
  );
};

export default CoreCircle;
