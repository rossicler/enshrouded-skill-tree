import { memo, useMemo, useState } from "react";

import { Node } from "../constants/Nodes";
import SkillTooltip from "./SkillTooltip";
import LineTo from "react-lineto";
import { getAsset } from "../utils/assets-utils";

type PropsType = {
  node: Node;
  selected?: boolean;
  selectable?: boolean;
  onSelect?: (node: Node) => void;
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

const SkillNode = ({
  node,
  selected = false,
  selectable,
  onSelect,
}: PropsType) => {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const nodeSize = SIZE[node.tier ?? "small"];

  const asset = useMemo(
    () => getAsset(node, selected, selectable),
    [node, selected, selectable]
  );

  const selectHandler = () => {
    if (onSelect) onSelect(node);
  };

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
            <button onClick={selectHandler}>
              <img
                src={asset}
                alt={node.type}
                className="w-full h-auto object-contain"
                data-tooltip-id={`skill-tooltip-${node.id}`}
              />
            </button>
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

export default memo(SkillNode);
