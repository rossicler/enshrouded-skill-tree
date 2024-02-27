import useScreenSize from "@/hooks/useScreenSize";
import React, { memo, useEffect, useRef } from "react";

type PropsType = {
  from: string;
  to: string;
  color: string;
  containerId?: string;
  prefixFrom?: string;
  prefixTo?: string;
};

const SkillPath = ({
  from,
  to,
  color,
  containerId,
  prefixFrom = "node",
  prefixTo = "node",
}: PropsType) => {
  const lineRef = useRef<SVGLineElement>(null);

  useEffect(() => {
    const fromElement = document.getElementById(`${prefixFrom}-${from}`);
    const toElement = document.getElementById(`${prefixTo}-${to}`);
    const svg = document.getElementById(containerId ?? "svg-container");

    if (fromElement && toElement && svg) {
      const fromRect = fromElement.getBoundingClientRect();
      const toRect = toElement.getBoundingClientRect();

      const svgRect = svg.getBoundingClientRect();

      const svgX = svgRect.left;
      const svgY = svgRect.top;

      const fromX = fromRect.left - svgX + fromRect.width / 2;
      const fromY = fromRect.top - svgY + fromRect.height / 2;
      const toX = toRect.left - svgX + toRect.width / 2;
      const toY = toRect.top - svgY + toRect.height / 2;

      const line = lineRef.current;
      if (line) {
        line.setAttribute("x1", String(fromX));
        line.setAttribute("y1", String(fromY));
        line.setAttribute("x2", String(toX));
        line.setAttribute("y2", String(toY));
      }
    }
  }, [from, to, containerId]);

  return (
    <line
      id={`line-${from}-${to}`}
      ref={lineRef}
      strokeWidth="1"
      stroke={color}
    />
  );
};

export default memo(SkillPath);
