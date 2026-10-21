import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type TouchEvent,
} from "react";
import { Tooltip } from "react-tooltip";
import {
  applySkillAction,
  getSelectableSkills,
  removeSkills,
  type SkillAction,
  type SkillChange,
  type SkillSelection,
} from "@enshrouded/core";

import type { NodeState } from "./art";
import { PAN_MARGIN, TREE_TO_PX, getTreeLayout } from "./layout";
import { PanZoom, type FitSize, type PanZoomHandle } from "./PanZoom";
import { useSkillTreeSettings } from "./SkillTreeProvider";
import { SkillTooltipCard } from "./SkillTooltip";
import Defs from "./svg/Defs";
import { SkillLink } from "./svg/SkillLink";
import { SkillNode } from "./svg/SkillNode";
import { CoreCircle, TreeLabels } from "./svg/TreeBackdrop";

// A refund that takes this many skills (the clicked one included) asks first.
const REFUND_CONFIRM_THRESHOLD = 2;
const LONG_PRESS_MS = 500;
const DOUBLE_TAP_MS = 300;
const FLASH_MS = 600;
const FOCUS_ANIMATION_MS = 300;
// Hovering a node opens its tooltip after this long (unless one is open).
const TOOLTIP_OPEN_DELAY_MS = 500;
// Time for the pointer to cross from the node into the tooltip.
const TOOLTIP_CLOSE_DELAY_MS = 100;

export type RefundRequest = { nodeId: string; removed: string[] };

export type SkillTreeViewHandle = {
  zoomIn: (step?: number) => void;
  zoomOut: (step?: number) => void;
  // Back to the initial view: the whole tree centered at the initial zoom.
  center: () => void;
  // Zooms in on a node. `showTooltip` opens its tooltip once there.
  focusNode: (nodeId: string, options?: { animationMs?: number; showTooltip?: boolean }) => void;
};

export type SkillTreeViewProps = {
  // Skill ID -> level. The view is controlled: it never changes this itself.
  selection: SkillSelection;
  // Called with the next selection after a click or a tooltip button.
  // Without it the tree is read-only (tooltips still work).
  onSelectionChange?: (selection: SkillSelection, change: SkillChange) => void;
  // Asked before a refund that takes other skills with it. Unset: refund at once.
  confirmRefund?: (request: RefundRequest) => boolean | Promise<boolean>;
  // Skill types to highlight, e.g. search matches.
  highlightedTypes?: readonly string[];
  // Node to zoom in on at first, instead of the centered tree.
  initialFocusNodeId?: string;
  // Shows a share button in the tooltip that copies this URL.
  getNodeShareUrl?: (nodeId: string) => string;
  // "center" (default): the planner's view, the tree centered at a fixed zoom.
  // "fit": the whole tree fitted to the container, which is also the most
  // zoomed-out view, and zoom steps that feel the same at any size.
  initialView?: "center" | "fit";
  // How the tooltip is positioned. "fixed" lets it leave a small or clipped
  // container while staying inside the viewport. Default "absolute".
  tooltipStrategy?: "absolute" | "fixed";
  className?: string;
  style?: CSSProperties;
};

const nodeElementOf = (target: EventTarget | null): Element | null =>
  target instanceof Element ? target.closest("[data-node-id]") : null;
const nodeIdOf = (target: EventTarget | null): string | null => nodeElementOf(target)?.getAttribute("data-node-id") ?? null;
// The pointer moved within one node. Compares elements, since another tree on
// the page has nodes with the same ids.
const withinNode = (e: MouseEvent) => nodeElementOf(e.relatedTarget) === nodeElementOf(e.target);

// The tree without the pan margin, in content px: what a fitted view shows.
let fitSize: FitSize | undefined;
const treeFitSize = (hx: number, hy: number): FitSize =>
  (fitSize ??= { width: 2 * (hx - PAN_MARGIN), height: 2 * (hy - PAN_MARGIN) });

const cssString = (value: string) => value.replace(/["\\]/g, "\\$&");

const isCoarsePointer = () => typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;

// The skill tree as SVG, with pan and zoom, node actions, tooltips and search
// highlights. It fills its container, so give the container a size.
export const SkillTreeView = forwardRef<SkillTreeViewHandle, SkillTreeViewProps>(function SkillTreeView(props, ref) {
  const { selection, highlightedTypes, initialFocusNodeId, getNodeShareUrl, initialView = "center", tooltipStrategy, className, style } =
    props;
  const settings = useSkillTreeSettings();
  const { locale, assetBaseUrl } = settings;
  const layout = getTreeLayout();
  const scope = `st${useId().replace(/[^\w]/g, "")}`;
  const readOnly = !props.onSelectionChange;

  // Handlers read the latest props through refs, so they never change and
  // the nodes never re-render because of them.
  const latest = useRef(props);
  latest.current = props;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const panZoomRef = useRef<PanZoomHandle>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const selectable = useMemo(() => new Set(getSelectableSkills(selection)), [selection]);
  const highlighted = useMemo(() => new Set(highlightedTypes ?? []), [highlightedTypes]);
  const stateOf = (id: string): NodeState => (selection[id] != null ? "selected" : selectable.has(id) ? "selectable" : "locked");

  // The out-of-range label of a refused node flashes for a moment.
  const [flashNodeId, setFlashNodeId] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flash = useCallback((nodeId: string) => {
    clearTimeout(flashTimer.current);
    setFlashNodeId(nodeId);
    flashTimer.current = setTimeout(() => setFlashNodeId(null), FLASH_MS);
  }, []);
  useEffect(() => () => clearTimeout(flashTimer.current), []);

  const act = useCallback(
    (nodeId: string, action: SkillAction) => {
      const { selection: current, onSelectionChange, confirmRefund } = latest.current;
      if (!onSelectionChange) return;
      const { hardCap, playSound: play, notify } = settingsRef.current;
      const result = applySkillAction(current, nodeId, action, { maxPoints: hardCap });
      switch (result.type) {
        case "none":
          return;
        case "out-of-range":
          play("node-out-of-range", 0.4);
          flash(nodeId);
          notify({ type: "out-of-range", nodeId });
          return;
        case "hard-cap":
          play("node-refund", 0.4);
          notify({ type: "hard-cap", nodeId, maxPoints: hardCap ?? 0 });
          return;
        case "refund":
          if (result.removed.length >= REFUND_CONFIRM_THRESHOLD && confirmRefund) {
            void Promise.resolve(confirmRefund({ nodeId, removed: result.removed })).then((confirmed) => {
              if (!confirmed) return;
              // The build may have changed while the host was asking.
              const now = latest.current;
              settingsRef.current.playSound("node-refund", 0.4);
              now.onSelectionChange?.(removeSkills(now.selection, result.removed), {
                ...result,
                selection: removeSkills(now.selection, result.removed),
              });
            });
            return;
          }
          play("node-refund", 0.4);
          onSelectionChange(result.selection, result);
          return;
        case "level-down":
          play("node-refund", 0.4);
          onSelectionChange(result.selection, result);
          return;
        default:
          play("node-unlock", 0.4);
          onSelectionChange(result.selection, result);
      }
    },
    [flash]
  );

  // The tooltip's open state is ours, not react-tooltip's: the library only
  // draws it (imperativeModeOnly + isOpen), anchored on the one node it shows.
  // Hover boundary events can't be trusted to close it (Chrome sends no
  // mouseout for a tooltip button replaced under a finger, and focusNode
  // opens it without any hover), so each close path works on its own: the
  // mouse leaving, a press anywhere outside it, Escape, its close button, and
  // a pan or zoom. `nodeId` stays set once closed, so the card keeps its
  // content while it fades out.
  const [tip, setTip] = useState<{ nodeId: string; open: boolean } | null>(null);
  const openNodeId = useRef<string | null>(null);
  const tipTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const openTooltip = useCallback((nodeId: string) => {
    clearTimeout(tipTimer.current);
    openNodeId.current = nodeId;
    setTip((current) => (current?.open && current.nodeId === nodeId ? current : { nodeId, open: true }));
  }, []);
  const closeTooltip = useCallback(() => {
    clearTimeout(tipTimer.current);
    openNodeId.current = null;
    setTip((current) => (current?.open ? { ...current, open: false } : current));
  }, []);
  // One pending tooltip change at a time: a later one replaces it.
  const tooltipLater = useCallback((run: () => void, ms: number) => {
    clearTimeout(tipTimer.current);
    tipTimer.current = setTimeout(run, ms);
  }, []);
  useEffect(() => () => clearTimeout(tipTimer.current), []);

  // While it is open, a press outside the tooltip (anywhere on the page, but
  // not on this tree's nodes, which hover and taps handle) or Escape closes
  // it. The listeners are this view's own and exist only while its tooltip
  // is open, so other trees on the page are unaffected.
  const tipOpen = !!tip?.open;
  useEffect(() => {
    if (!tipOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target instanceof Node ? e.target : null;
      if (target && tooltipRef.current?.contains(target)) return;
      if (target && svgRef.current?.contains(target) && nodeIdOf(target)) return;
      closeTooltip();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTooltip();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [tipOpen, closeTooltip]);

  // Pointer input, delegated from the <svg> to the node under the pointer.
  // Touch screens need a double tap to unlock (a single tap shows the
  // tooltip) and a long press to refund.
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

  const handlers = useMemo(
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
          act(nodeId, "primary");
          return;
        }
        if (tap.current) clearTimeout(tap.current.timer);
        tap.current = { nodeId, timer: setTimeout(() => (tap.current = null), DOUBLE_TAP_MS) };
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
      // Hover (on touch, the mouse events a tap sends): a node opens its
      // tooltip after a delay, or at once while another one is open.
      onMouseOver: (e: MouseEvent) => {
        const nodeId = nodeIdOf(e.target);
        if (!nodeId || withinNode(e)) return;
        settingsRef.current.playSound("node-hover", 0.2);
        if (openNodeId.current === nodeId) clearTimeout(tipTimer.current);
        else if (openNodeId.current) openTooltip(nodeId);
        else tooltipLater(() => openTooltip(nodeId), TOOLTIP_OPEN_DELAY_MS);
      },
      onMouseOut: (e: MouseEvent) => {
        const nodeId = nodeIdOf(e.target);
        if (!nodeId || withinNode(e)) return;
        if (openNodeId.current) tooltipLater(closeTooltip, TOOLTIP_CLOSE_DELAY_MS);
        else clearTimeout(tipTimer.current);
      },
    }),
    [act, cancelLongPress, openTooltip, closeTooltip, tooltipLater]
  );

  const nodeElement = (nodeId: string) => svgRef.current?.querySelector<SVGElement>(`[data-node-id="${cssString(nodeId)}"]`) ?? null;

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: (step) => panZoomRef.current?.zoomIn(step),
      zoomOut: (step) => panZoomRef.current?.zoomOut(step),
      center: () => panZoomRef.current?.center(),
      focusNode: (nodeId, { animationMs = FOCUS_ANIMATION_MS, showTooltip = false } = {}) => {
        const el = nodeElement(nodeId);
        if (!el) return;
        panZoomRef.current?.zoomToElement(el, animationMs);
        // Once the zoom settles, open the tooltip.
        if (showTooltip) tooltipLater(() => openTooltip(nodeId), animationMs + 50);
      },
    }),
    [openTooltip, tooltipLater]
  );

  const onPanZoomReady = useCallback(() => {
    const focusId = latest.current.initialFocusNodeId;
    const el = focusId ? nodeElement(focusId) : null;
    if (el) panZoomRef.current?.zoomToElement(el, 0);
    else panZoomRef.current?.center(0);
  }, []);

  const share = useCallback((nodeId: string) => {
    const url = latest.current.getNodeShareUrl?.(nodeId);
    if (!url) return;
    void navigator.clipboard?.writeText(url).then(() => settingsRef.current.notify({ type: "link-copied", nodeId, url }));
  }, []);

  const { x: hx, y: hy } = layout.halfExtent;

  return (
    <div
      className={className}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", ...style }}
      data-skill-tree-scope={scope}
    >
      <PanZoom
        ref={panZoomRef}
        onReady={onPanZoomReady}
        focusKey={initialFocusNodeId}
        fitSize={initialView === "fit" ? treeFitSize(hx, hy) : undefined}
        onUserMove={closeTooltip}
      >
        <svg
          ref={svgRef}
          width={hx * 2}
          height={hy * 2}
          viewBox={`${-hx / TREE_TO_PX} ${-hy / TREE_TO_PX} ${(hx * 2) / TREE_TO_PX} ${(hy * 2) / TREE_TO_PX}`}
          style={{ display: "block", overflow: "visible" }}
          {...handlers}
        >
          <Defs scope={scope} />
          <g>
            {layout.links.map((link) => (
              <SkillLink
                key={link.key}
                link={link}
                connected={link.kind === "base" ? selection[link.from] != null : selection[link.from] != null && selection[link.to] != null}
              />
            ))}
          </g>
          <CoreCircle scope={scope} />
          <g>
            {layout.nodeIds.map((id) => (
              <SkillNode
                key={id}
                id={id}
                state={stateOf(id)}
                level={selection[id] ?? 0}
                searched={highlighted.has(layout.nodes[id].node.type)}
                assetBaseUrl={assetBaseUrl}
                scope={scope}
              />
            ))}
          </g>
          <TreeLabels assetBaseUrl={assetBaseUrl} locale={locale} />
        </svg>
      </PanZoom>
      <Tooltip
        // Anchored on the tooltip's node. Before the first one opens, any of
        // this tree's nodes: with no anchor at all, the library re-renders
        // after every change of the build.
        anchorSelect={`[data-skill-tree-scope="${scope}"] [data-node-id${tip ? `="${cssString(tip.nodeId)}"` : ""}]`}
        imperativeModeOnly
        isOpen={tipOpen}
        // The library closes it itself only when its anchor leaves the page.
        setIsOpen={(open) => {
          if (!open) closeTooltip();
        }}
        className="!p-0 !bg-transparent !border-0 !rounded-none"
        style={{ zIndex: 9999 }}
        positionStrategy={tooltipStrategy}
        noArrow
        clickable
        render={({ activeAnchor }) => {
          const nodeId = activeAnchor?.getAttribute("data-node-id");
          if (!nodeId) return null;
          return (
            <div
              ref={tooltipRef}
              // Moving into the tooltip keeps it open, and leaving it closes
              // it (unless the mouse goes back to its node).
              onMouseEnter={() => {
                if (openNodeId.current) clearTimeout(tipTimer.current);
              }}
              onMouseLeave={() => {
                if (openNodeId.current) tooltipLater(closeTooltip, TOOLTIP_CLOSE_DELAY_MS);
              }}
            >
              <SkillTooltipCard
                nodeId={nodeId}
                state={stateOf(nodeId)}
                level={selection[nodeId] ?? 0}
                flash={flashNodeId === nodeId}
                locale={locale}
                assetBaseUrl={assetBaseUrl}
                readOnly={readOnly}
                onAction={act}
                onShare={getNodeShareUrl ? share : undefined}
                onClose={closeTooltip}
              />
            </div>
          );
        }}
      />
    </div>
  );
});
