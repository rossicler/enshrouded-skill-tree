import { Tooltip } from "react-tooltip";

import SkillNodes, { Node } from "../constants/Nodes";

type PropsType = {
  node: Node;
  onShow?: () => void;
  onHide?: () => void;
};

const SkillTooltip = ({ node, onShow, onHide }: PropsType) => {
  const metadata = SkillNodes.types[node.type];
  return (
    <Tooltip
      id={`skill-tooltip-${node.id}`}
      className="z-50 p-2"
      afterShow={onShow}
      afterHide={onHide}
    >
      <span className="uppercase text-xl text-white">
        {metadata ? metadata.name : node.type}
      </span>
      {metadata && (
        <div className="flex flex-col gap-2 mt-2">
          {metadata.description.map((html, i) => (
            <div
              key={`${node.id}-p${i}`}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ))}
        </div>
      )}
    </Tooltip>
  );
};

export default SkillTooltip;
