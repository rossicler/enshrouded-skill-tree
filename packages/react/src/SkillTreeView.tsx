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
} from "react";
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
import { cssString, nodeIdOf } from "./nodeDom";
import { PanZoom, type FitSize, type PanZoomHandle } from "./PanZoom";
import { useSkillTreeSettings } from "./SkillTreeProvider";
import Defs from "./svg/Defs";
import { SkillLink } from "./svg/SkillLink";
import { SkillNode } from "./svg/SkillNode";
import { CoreCircle, TreeLabels } from "./svg/TreeBackdrop";
import { TreeTooltip } from "./tooltip/TreeTooltip";
import { useTreeTooltip } from "./tooltip/useTreeTooltip";
import { useNodeGestures } from "./useNodeGestures";

// A refund that takes this many skills (the clicked one included) asks first.
const REFUND_CONFIRM_THRESHOLD = 2;
const FLASH_MS = 600;
const FOCUS_ANIMATION_MS = 300;

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
  // Skill type -> ring color(s) around every node of that type, e.g. stat
  // highlights (getStatMarkers). Several colors split the ring into arcs.
  markedTypes?: Readonly<Record<string, string | readonly string[]>>;
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

// The tree without the pan margin, in content px: what a fitted view shows.
let fitSize: FitSize | undefined;
const treeFitSize = (hx: number, hy: number): FitSize =>
  (fitSize ??= { width: 2 * (hx - PAN_MARGIN), height: 2 * (hy - PAN_MARGIN) });

// The skill tree as SVG, with pan and zoom, node actions, tooltips and search
// highlights. It fills its container, so give the container a size.
export const SkillTreeView = forwardRef<SkillTreeViewHandle, SkillTreeViewProps>(function SkillTreeView(props, ref) {
  const { selection, highlightedTypes, markedTypes, initialFocusNodeId, getNodeShareUrl, initialView = "center", tooltipStrategy, className, style } =
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

  const isOwnNode = useCallback((target: Node) => !!svgRef.current?.contains(target) && !!nodeIdOf(target), []);
  const tooltip = useTreeTooltip({ isOwnNode });
  const { close: closeTooltip, openAfterFocus, onUserMove } = tooltip;

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
            // The host's confirmation takes over: close the tooltip so it
            // can't sit on top of the host's dialog.
            closeTooltip();
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
    [flash, closeTooltip]
  );

  const playHoverSound = useCallback(() => settingsRef.current.playSound("node-hover", 0.2), []);
  const handlers = useNodeGestures({ act, tooltip, playHoverSound });

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
        if (showTooltip) openAfterFocus(nodeId, animationMs + 50);
      },
    }),
    [openAfterFocus]
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
        onUserMove={onUserMove}
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
                marker={markedTypes?.[layout.nodes[id].node.type]}
                assetBaseUrl={assetBaseUrl}
                scope={scope}
              />
            ))}
          </g>
          <TreeLabels assetBaseUrl={assetBaseUrl} locale={locale} />
        </svg>
      </PanZoom>
      <TreeTooltip
        tooltip={tooltip}
        scope={scope}
        positionStrategy={tooltipStrategy}
        cardFor={(nodeId) => ({
          state: stateOf(nodeId),
          level: selection[nodeId] ?? 0,
          flash: flashNodeId === nodeId,
          locale,
          assetBaseUrl,
          readOnly,
          onAction: act,
          onShare: getNodeShareUrl ? share : undefined,
        })}
      />
    </div>
  );
});
