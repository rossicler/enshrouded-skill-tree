import React, { memo, useCallback, useEffect, useRef } from "react";

type PropsType = {
  from: string;
  to: string;
  color: string;
  connected?: boolean;
  containerId?: string;
  prefixFrom?: string;
  prefixTo?: string;
};

const SkillPath = ({
  from,
  to,
  color,
  connected = false,
  containerId,
  prefixFrom = "node",
  prefixTo = "node",
}: PropsType) => {
  const lineRef = useRef<SVGLineElement>(null);

  const updatePosition = useCallback(() => {
    const fromElement = document.getElementById(`${prefixFrom}-${from}`);
    const toElement = document.getElementById(`${prefixTo}-${to}`);
    const svg = document.getElementById(containerId ?? "svg-container");

    if (fromElement && toElement && svg) {
      const fromRect = fromElement.getBoundingClientRect();
      const toRect = toElement.getBoundingClientRect();

      const svgRect = svg.getBoundingClientRect();

      const svgX = svgRect.left;
      const svgY = svgRect.top;
      // The svg sits inside the pan/zoom transform, so screen distances are
      // divided by the current scale to get its own coordinates. Without this,
      // lines measured while zoomed would be drawn too long.
      const scale = svg.clientWidth ? svgRect.width / svg.clientWidth : 1;

      const fromX = (fromRect.left - svgX + fromRect.width / 2) / scale;
      const fromY = (fromRect.top - svgY + fromRect.height / 2) / scale;
      const toX = (toRect.left - svgX + toRect.width / 2) / scale;
      const toY = (toRect.top - svgY + toRect.height / 2) / scale;

      const line = lineRef.current;
      if (line) {
        line.setAttribute("x1", String(fromX));
        line.setAttribute("y1", String(fromY));
        line.setAttribute("x2", String(toX));
        line.setAttribute("y2", String(toY));
      }
    }
  }, [from, to, containerId, prefixFrom, prefixTo]);

  useEffect(() => {
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
    };
  }, [updatePosition]);

  return (
    <line
      id={`line-${from}-${to}`}
      ref={lineRef}
      data-link-from={from}
      data-link-to={to}
      data-link-kind={prefixTo === "line" ? "base" : "edge"}
      data-connected={connected ? "true" : "false"}
      strokeWidth="1"
      stroke={color}
    />
  );
};

export default memo(SkillPath);
