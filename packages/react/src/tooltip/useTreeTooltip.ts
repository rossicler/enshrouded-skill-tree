import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

// A second tap on a node within this long adds a point instead of a tooltip.
export const DOUBLE_TAP_MS = 300;
// Hovering a node opens its tooltip after this long (unless one is open).
export const TOOLTIP_OPEN_DELAY_MS = 500;
// Time for the pointer to cross from the node into the tooltip.
export const TOOLTIP_CLOSE_DELAY_MS = 100;
// Boundary events this close in time, at one position, are one mouse move.
const SAME_MOVE_MS = 4;

export type TreeTooltipState = { nodeId: string; open: boolean } | null;
export type PointerKind = "touch" | "move" | "resting";

export type UseTreeTooltipOptions = {
  // The target is one of this tree's nodes. Presses on them don't close the
  // tooltip: hover and taps handle those.
  isOwnNode: (target: Node) => boolean;
};

// The tooltip's open state is ours, not react-tooltip's: the library only
// draws it (imperativeModeOnly + isOpen), anchored on the one node it shows.
// Mouse boundary events can't be trusted for it: Chrome sends no mouseout
// for a tooltip button replaced under a finger, the mouse events a tap
// sends differ between platforms, and focusNode opens it without any
// hover. So a mouse opens it by hover (pointer events of pointerType
// "mouse"), a tap from the click handler, and focusNode directly, and each
// close path works on its own: the mouse leaving, a press anywhere outside
// it, Escape, its close button, and a pan or zoom. `tip.nodeId` stays set
// once closed, so the card keeps its content while it fades out.
export const useTreeTooltip = ({ isOwnNode }: UseTreeTooltipOptions) => {
  const [tip, setTip] = useState<TreeTooltipState>(null);
  const openNodeId = useRef<string | null>(null);
  // A pending open or close by hover or tap; a later one replaces it.
  const tipTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // focusNode's open, which pointer moves over the zooming tree don't cancel.
  const focusTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const isOwnNodeRef = useRef(isOwnNode);
  isOwnNodeRef.current = isOwnNode;

  const open = useCallback((nodeId: string) => {
    clearTimeout(tipTimer.current);
    clearTimeout(focusTimer.current);
    openNodeId.current = nodeId;
    setTip((current) => (current?.open && current.nodeId === nodeId ? current : { nodeId, open: true }));
  }, []);
  // Leaves a pending focusNode open alone: the mouse leaving another
  // tooltip while the tree zooms there is no reason to drop it.
  const close = useCallback(() => {
    clearTimeout(tipTimer.current);
    openNodeId.current = null;
    setTip((current) => (current?.open ? { ...current, open: false } : current));
  }, []);
  const later = useCallback((run: () => void, ms: number) => {
    clearTimeout(tipTimer.current);
    tipTimer.current = setTimeout(run, ms);
  }, []);
  // Drops a pending hover or tap open or close.
  const cancelPending = useCallback(() => clearTimeout(tipTimer.current), []);
  // The user panning or zooming closes it, and drops a pending focusNode open.
  const onUserMove = useCallback(() => {
    clearTimeout(focusTimer.current);
    close();
  }, [close]);
  // Opens it once focusNode's zoom settles.
  const openAfterFocus = useCallback(
    (nodeId: string, ms: number) => {
      clearTimeout(focusTimer.current);
      focusTimer.current = setTimeout(() => open(nodeId), ms);
    },
    [open]
  );

  // What sent a pointer boundary event. Touch is left to taps and the
  // press-outside rule. A resting mouse also gets boundary events when
  // content moves under it (the tooltip appearing or changing size, the tree
  // zooming): "resting" events come at the position of the last one but in a
  // later dispatch, while the events of one real move share its time stamp.
  // A node sliding under the mouse doesn't open its tooltip, and the tooltip
  // moving away from under it doesn't close it; a node sliding away still
  // ends its hover.
  const lastMouse = useRef<{ x: number; y: number; t: number } | null>(null);
  const pointerKind = useCallback((e: ReactPointerEvent): PointerKind => {
    if (e.pointerType === "touch") return "touch";
    const last = lastMouse.current;
    if (last && last.x === e.clientX && last.y === e.clientY) return Math.abs(e.timeStamp - last.t) < SAME_MOVE_MS ? "move" : "resting";
    lastMouse.current = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    return "move";
  }, []);

  // A node hovered: open its tooltip at once while another one is open, else
  // after the hover delay.
  const showOnHover = useCallback(
    (nodeId: string) => {
      if (openNodeId.current === nodeId) clearTimeout(tipTimer.current);
      else if (openNodeId.current) open(nodeId);
      else later(() => open(nodeId), TOOLTIP_OPEN_DELAY_MS);
    },
    [open, later]
  );
  // The pointer left a node: close the open tooltip unless it reaches the
  // tooltip in time, or drop a pending hover open.
  const hideOnLeave = useCallback(() => {
    if (openNodeId.current) later(close, TOOLTIP_CLOSE_DELAY_MS);
    else clearTimeout(tipTimer.current);
  }, [later, close]);
  // A node tapped. Opens once the double-tap window passes, not after the
  // mouse hover delay: a second tap in the window cancels it (cancelPending)
  // and adds a point instead, so a double tap never flashes the tooltip.
  const showAfterTap = useCallback(
    (nodeId: string) => {
      if (openNodeId.current !== nodeId) later(() => open(nodeId), DOUBLE_TAP_MS);
    },
    [later, open]
  );

  // Moving into the tooltip keeps it open, and leaving it closes it (unless
  // the mouse goes back to its node). Touch is left to the press-outside rule.
  const wrapperHandlers = useMemo(
    () => ({
      onPointerEnter: (e: ReactPointerEvent) => {
        if (pointerKind(e) !== "touch" && openNodeId.current) clearTimeout(tipTimer.current);
      },
      onPointerLeave: (e: ReactPointerEvent) => {
        if (pointerKind(e) === "move" && openNodeId.current) later(close, TOOLTIP_CLOSE_DELAY_MS);
      },
    }),
    [pointerKind, later, close]
  );

  useEffect(
    () => () => {
      clearTimeout(tipTimer.current);
      clearTimeout(focusTimer.current);
    },
    []
  );

  // While it is open, a press outside the tooltip (anywhere on the page, but
  // not on this tree's nodes, which hover and taps handle) or Escape closes
  // it. The listeners are this tree's own and exist only while its tooltip
  // is open, so other trees on the page are unaffected.
  const isOpen = !!tip?.open;
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target instanceof Node ? e.target : null;
      if (target && tooltipRef.current?.contains(target)) return;
      if (target && isOwnNodeRef.current(target)) return;
      close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [isOpen, close]);

  return {
    tip,
    isOpen,
    tooltipRef,
    wrapperHandlers,
    open,
    close,
    cancelPending,
    showOnHover,
    hideOnLeave,
    showAfterTap,
    openAfterFocus,
    onUserMove,
    pointerKind,
  };
};

export type TreeTooltipApi = ReturnType<typeof useTreeTooltip>;
