import { useCallback, useEffect, useMemo, useRef, type MouseEvent, type PointerEvent as ReactPointerEvent, type TouchEvent } from "react";
import type { SkillAction } from "@enshrouded/core";

import { nodeIdOf, withinNode } from "./nodeDom";
import { DOUBLE_TAP_MS, type TreeTooltipApi } from "./tooltip/useTreeTooltip";

const LONG_PRESS_MS = 500;

const isCoarsePointer = () => typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;

export type NodeGesturesOptions = {
  act: (nodeId: string, action: SkillAction) => void;
  tooltip: Pick<TreeTooltipApi, "cancelPending" | "showAfterTap" | "showOnHover" | "hideOnLeave" | "pointerKind">;
  playHoverSound: () => void;
};

// Pointer input, delegated from the <svg> to the node under the pointer.
// Touch screens need a double tap to unlock (a single tap shows the
// tooltip) and a long press to refund. Returns the <svg>'s handlers, which
// stay the same as long as `act` and `playHoverSound` do.
export const useNodeGestures = ({ act, tooltip, playHoverSound }: NodeGesturesOptions) => {
  const { cancelPending, showAfterTap, showOnHover, hideOnLeave, pointerKind } = tooltip;
  const tap = useRef<{ nodeId: string; timer: ReturnType<typeof setTimeout> } | null>(null);
  const longPress = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClick = useRef<string | null>(null);
  const cancelLongPress = useCallback(() => {
    if (longPress.current) clearTimeout(longPress.current);
    longPress.current = null;
  }, []);
  useEffect(
    () => () => {
      cancelLongPress();
      if (tap.current) clearTimeout(tap.current.timer);
    },
    [cancelLongPress]
  );

  return useMemo(
    () => ({
      onClick: (e: MouseEvent) => {
        const nodeId = nodeIdOf(e.target);
        if (!nodeId) return;
        e.preventDefault();
        e.stopPropagation();
        if (suppressClick.current === nodeId) {
          suppressClick.current = null;
          return;
        }
        if (!isCoarsePointer()) {
          act(nodeId, "primary");
          return;
        }
        if (tap.current?.nodeId === nodeId) {
          clearTimeout(tap.current.timer);
          tap.current = null;
          // A double tap adds a point; drop the first tap's pending tooltip.
          cancelPending();
          act(nodeId, "primary");
          return;
        }
        if (tap.current) clearTimeout(tap.current.timer);
        tap.current = { nodeId, timer: setTimeout(() => (tap.current = null), DOUBLE_TAP_MS) };
        showAfterTap(nodeId);
      },
      onContextMenu: (e: MouseEvent) => {
        const nodeId = nodeIdOf(e.target);
        if (!nodeId) return;
        e.preventDefault();
        e.stopPropagation();
        act(nodeId, "secondary");
      },
      onTouchStart: (e: TouchEvent) => {
        cancelLongPress();
        const nodeId = nodeIdOf(e.target);
        if (!nodeId) return;
        longPress.current = setTimeout(() => {
          longPress.current = null;
          suppressClick.current = nodeId;
          act(nodeId, "secondary");
        }, LONG_PRESS_MS);
      },
      onTouchEnd: cancelLongPress,
      onTouchMove: cancelLongPress,
      onTouchCancel: cancelLongPress,
      onMouseOver: (e: MouseEvent) => {
        const nodeId = nodeIdOf(e.target);
        if (nodeId && !withinNode(e)) playHoverSound();
      },
      // Hover with a mouse (a tap opens it from onClick above).
      onPointerOver: (e: ReactPointerEvent) => {
        const nodeId = nodeIdOf(e.target);
        if (pointerKind(e) !== "move" || !nodeId || withinNode(e)) return;
        showOnHover(nodeId);
      },
      onPointerOut: (e: ReactPointerEvent) => {
        const nodeId = nodeIdOf(e.target);
        if (pointerKind(e) === "touch" || !nodeId || withinNode(e)) return;
        hideOnLeave();
      },
    }),
    [act, playHoverSound, cancelLongPress, cancelPending, showAfterTap, showOnHover, hideOnLeave, pointerKind]
  );
};
