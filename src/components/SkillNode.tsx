import { MouseEvent, memo, useMemo, useState } from "react";

import { Node } from "../constants/Nodes";
import SkillTooltip from "./SkillTooltip";
import { getAsset } from "../utils/assets-utils";
import Image from "next/image";
import SkillPath from "./shared/SkillPath";
import { classNames } from "@/utils/utils";
import { useAppSelector } from "@/redux/hooks";
import { playSound } from "@/utils/sounds";

type PropsType = {
  node: Node;
  selected?: boolean;
  selectable?: boolean;
  onSelect?: (node: Node) => void;
};

const SIZE = {
  small: {
    className: "w-[25px] h-[25px]",
    size: 25,
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
  const isSearched = useAppSelector((state) =>
    state.skill.searchSkillResults.includes(node.type)
  );
  const nodeSize = SIZE[node.tier ?? "small"];

  const [lowBritness, asset, iconAsset, iconOffset] = useMemo(
    () => getAsset(node, selected, selectable),
    [node, selected, selectable]
  );

  const selectHandler = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSelect) {
      onSelect(node);
    }
  };

  const iconSize =
    nodeSize.size - (selected || selectable ? 15 : 20) - (iconOffset ?? 0);

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
          id={`node-${node.id}`}
          className={`relative w-0.5 h-0.5`}
          style={{ marginTop: INIT_DISTANCE + (node.distance ?? 0) }}
        >
          <div
            className={classNames(
              "absolute rounded-full flex items-center justify-center",
              nodeSize.className,
              isSearched && "animate-flame-radiance"
            )}
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
            <button className="relative" onClick={selectHandler} onMouseEnter={() => playSound("node-hover", 0.2)}>
              {iconAsset && (
                <div
                  className="absolute inset-0 flex items-center justify-center z-10"
                  data-tooltip-id={`skill-tooltip-${node.id}`}
                >
                  <Image
                    className={classNames(
                      "object-contain !pointer-events-auto",
                      lowBritness && "brightness-50"
                    )}
                    src={iconAsset}
                    alt={node.type}
                    width={iconSize}
                    height={iconSize}
                  />
                </div>
              )}
              <Image
                src={asset}
                alt={node.type}
                width={nodeSize.size}
                height={nodeSize.size}
                className={classNames(
                  "w-full h-auto object-contain !pointer-events-auto",
                  lowBritness && "brightness-50"
                )}
                data-tooltip-id={`skill-tooltip-${node.id}`}
              />
            </button>
          </div>
        </div>
      </div>
      {node.base && (
        <SkillPath
          key={`base-line-${node.id}`}
          from={`node-${node.id}`}
          to={`line-${node.angle}`}
          color="#1c1829"
        />
      )}
    </>
  );
};

export default memo(SkillNode);
