import { useCallback, useMemo, useState } from "react";

import { Node } from "../constants/Nodes";
import Nodes from "../constants/Nodes";
import SkillTooltip from "./SkillTooltip";
import LineTo from "react-lineto";

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
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const nodeSize = SIZE[node.tier ?? "small"];
  const nodeMetadata = Nodes.types[node.type];

  const getAsset = useCallback(() => {
    let assetName = `${node.tier ?? "small"}`;
    if (nodeMetadata && nodeMetadata.hasAsset) {
      assetName = node.type;
    }
    return `./assets/${assetName}_gray.png`;
  }, [node, nodeMetadata]);

  const asset = useMemo(() => getAsset(), [getAsset]);

  if (!node.angle) return null;

  return (
    <>
      <div
        className={`absolute top-0 left-0 h-full ${tooltipOpen ? "z-50" : ""}`}
        style={{
          transformOrigin: "0% 0%",
          transform: `rotate(${node.angle}deg)`,
        }}
      >
        <div
          className={`relative w-0.5 h-0.5 node-${node.id}`}
          style={{ marginTop: INIT_DISTANCE + (node.distance ?? 0) }}
        >
          <div
            className={`absolute rounded-full ${nodeSize.className}`}
            style={{
              left: -nodeSize.size / 2,
              bottom: -nodeSize.size / 2,
              transformOrigin: "center",
              transform: `rotate(-${node.angle}deg)`,
            }}
          >
            <SkillTooltip
              node={node}
              onShow={() => setTooltipOpen(true)}
              onHide={() => setTooltipOpen(false)}
            />
            <img
              src={asset}
              alt={node.type}
              className="w-full h-auto object-contain"
              data-tooltip-id={`skill-tooltip-${node.id}`}
            />
          </div>
        </div>
      </div>
      {node.base && (
        <LineTo
          key={`base-line-${node.id}`}
          from={`node-${node.id}`}
          to={`line-${node.angle}`}
          within="wrapper"
          borderColor="#1c1829"
          delay={100}
        />
      )}
    </>
  );
};

export default SkillNode;
