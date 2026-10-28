import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { SkillChange, SkillSelection } from "@enshrouded/core";

import { assetUrl } from "./art";
import { CardControls, type CardAction } from "./CardControls";
import { useSkillTreeSettings } from "./SkillTreeProvider";
import { SkillTreeView, type RefundRequest, type SkillTreeViewHandle } from "./SkillTreeView";
import { uiText } from "./text";

// Used for a side the container leaves unsized (an auto height, say).
export const DEFAULT_CARD_SIZE = 360;
const FALLBACK_BACKGROUND = "radial-gradient(circle at 50% 50%, #2b2536 0%, #15121c 65%, #0d0b12 100%)";
// The planner's backdrop art, resized for cards (assets/backgrounds/).
const BACKGROUND_ART = "backgrounds/skill-tree.webp";

// CSS background for the card and its overlay: the art over the gradient
// (the gradient shows while the art loads), the gradient alone, or the host's.
const cardBackground = (background: SkillTreeCardProps["background"], assetBaseUrl: string) => {
  if (background === false) return FALLBACK_BACKGROUND;
  if (typeof background === "string") return background;
  return `url("${assetUrl(assetBaseUrl, BACKGROUND_ART)}") center / cover no-repeat, ${FALLBACK_BACKGROUND}`;
};

export type SkillTreeCardMode = "inline" | "expanded" | "fullscreen";

export type SkillTreeCardHandle = SkillTreeViewHandle & {
  // Opens the in-page overlay.
  expand: () => void;
  // Browser fullscreen on the card, or the overlay where that isn't available.
  fullscreen: () => void;
  // Back to the card from the overlay or fullscreen.
  close: () => void;
};

export type SkillTreeCardProps = {
  // Skill ID -> level. Controlled, as in SkillTreeView.
  selection: SkillSelection;
  onSelectionChange?: (selection: SkillSelection, change: SkillChange) => void;
  // No editing (tooltips still show). Also the case without onSelectionChange.
  readOnly?: boolean;
  confirmRefund?: (request: RefundRequest) => boolean | Promise<boolean>;
  highlightedTypes?: readonly string[];
  // Skill type -> ring color(s), as on SkillTreeView.
  markedTypes?: Readonly<Record<string, string | readonly string[]>>;
  getNodeShareUrl?: (nodeId: string) => string;
  // The zoom, expand and fullscreen buttons. Default true.
  controls?: boolean;
  // Behind the tree: true (default) shows the planner's backdrop art, false a
  // plain dark gradient, and a string is used as the CSS background.
  background?: boolean | string;
  // Accessible name of the card and its overlay. Default: "Skill tree".
  label?: string;
  onModeChange?: (mode: SkillTreeCardMode) => void;
  // The card fills its container: give the container (or this) a size. A
  // side the container leaves unsized falls back to DEFAULT_CARD_SIZE.
  className?: string;
  style?: CSSProperties;
};

type FullscreenDocument = Document & { webkitFullscreenEnabled?: boolean; webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => void };
type FullscreenElement = HTMLElement & { webkitRequestFullscreen?: () => void };

const fullscreenElement = () => {
  const doc = document as FullscreenDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
};
// iOS Safari has no fullscreen for anything but video: there the card falls
// back to the overlay.
const requestFullscreenOf = (el: FullscreenElement): (() => Promise<void> | void) | null => {
  const doc = document as FullscreenDocument;
  if (!(doc.fullscreenEnabled ?? doc.webkitFullscreenEnabled)) return null;
  if (el.requestFullscreen) return () => el.requestFullscreen();
  if (el.webkitRequestFullscreen) return () => el.webkitRequestFullscreen!();
  return null;
};
const exitFullscreen = () => {
  const doc = document as FullscreenDocument;
  if (doc.exitFullscreen) void doc.exitFullscreen().catch(() => {});
  else doc.webkitExitFullscreen?.();
};

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const FOCUSABLE = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// The skill tree in a box the host sizes: the whole tree fitted, the build
// highlighted, pan and zoom inside, the planner's editing and tooltips, and
// buttons to expand it to an in-page overlay or to fullscreen. The wheel
// zooms only while the card has focus (click it) or with Ctrl held, so the
// page still scrolls past it. Every card is independent of the others.
const SkillTreeCardBase = forwardRef<SkillTreeCardHandle, SkillTreeCardProps>(function SkillTreeCard(props, ref) {
  const {
    selection,
    onSelectionChange,
    readOnly = false,
    confirmRefund,
    highlightedTypes,
    markedTypes,
    getNodeShareUrl,
    controls = true,
    background = true,
    className,
    style,
  } = props;
  const { locale, assetBaseUrl } = useSkillTreeSettings();
  const backdrop = cardBackground(background, assetBaseUrl);
  const label = props.label ?? uiText(locale, "card.label");
  const root = useRef<HTMLDivElement>(null);
  const view = useRef<SkillTreeViewHandle>(null);
  const overlayView = useRef<SkillTreeViewHandle>(null);
  const [mode, setModeState] = useState<SkillTreeCardMode>("inline");
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const onModeChangeRef = useRef(props.onModeChange);
  onModeChangeRef.current = props.onModeChange;
  const returnFocus = useRef(false);

  const setMode = useCallback((next: SkillTreeCardMode) => {
    if (modeRef.current === next) return;
    modeRef.current = next;
    setModeState(next);
    onModeChangeRef.current?.(next);
  }, []);

  // A side the container leaves unsized measures 0 at 100%: use the default.
  const [fallback, setFallback] = useState({ width: false, height: false });
  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    // The client size leaves out a border the host may give the card.
    if (el && (el.clientWidth < 1 || el.clientHeight < 1)) setFallback({ width: el.clientWidth < 1, height: el.clientHeight < 1 });
  }, []);

  // The wheel zooms only with focus or Ctrl (also what a trackpad pinch
  // sends). Otherwise the event never reaches the zoom layer and the page
  // scrolls. In fullscreen the card is the whole screen, so it always zooms.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (modeRef.current === "fullscreen" || e.ctrlKey || el.contains(document.activeElement)) return;
      e.stopPropagation();
    };
    // A press on the tree doesn't reliably focus the card by itself (the
    // zoom layer handles it), so a press anywhere on the card focuses it.
    const onPointerDown = () => {
      if (!el.contains(document.activeElement)) el.focus({ preventScroll: true });
    };
    el.addEventListener("wheel", onWheel, { capture: true, passive: true });
    el.addEventListener("pointerdown", onPointerDown, { capture: true });
    return () => {
      el.removeEventListener("wheel", onWheel, { capture: true });
      el.removeEventListener("pointerdown", onPointerDown, { capture: true });
    };
  }, []);

  const close = useCallback(() => {
    const current = modeRef.current;
    if (current === "inline") return;
    returnFocus.current = true;
    if (current === "fullscreen" && fullscreenElement() === root.current) exitFullscreen();
    setMode("inline");
  }, [setMode]);

  const expand = useCallback(() => {
    if (modeRef.current === "fullscreen") return;
    setMode("expanded");
  }, [setMode]);

  const fullscreen = useCallback(() => {
    const el = root.current as FullscreenElement | null;
    if (!el || modeRef.current === "fullscreen") return;
    const request = requestFullscreenOf(el);
    if (!request) {
      expand();
      return;
    }
    setMode("fullscreen");
    try {
      void Promise.resolve(request()).catch(() => setMode("expanded"));
    } catch {
      setMode("expanded");
    }
  }, [expand, setMode]);

  // Fullscreen ends from outside too (Esc, the browser's own UI). The event
  // is fired at the element itself, so each card hears only its own.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const onChange = () => {
      if (fullscreenElement() === el) return;
      if (modeRef.current === "fullscreen") {
        returnFocus.current = true;
        setMode("inline");
      }
    };
    el.addEventListener("fullscreenchange", onChange);
    el.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      el.removeEventListener("fullscreenchange", onChange);
      el.removeEventListener("webkitfullscreenchange", onChange);
      if (fullscreenElement() === el) exitFullscreen();
    };
  }, [setMode]);

  // Back on the card: focus returns to it, and the tree is fitted again.
  useEffect(() => {
    if (mode !== "inline" || !returnFocus.current) return;
    returnFocus.current = false;
    root.current?.focus({ preventScroll: true });
  }, [mode]);

  const activeView = () => (modeRef.current === "expanded" ? overlayView.current : view.current);
  useImperativeHandle(
    ref,
    () => ({
      zoomIn: (step) => activeView()?.zoomIn(step),
      zoomOut: (step) => activeView()?.zoomOut(step),
      center: () => activeView()?.center(),
      focusNode: (nodeId, options) => activeView()?.focusNode(nodeId, options),
      expand,
      fullscreen,
      close,
    }),
    [expand, fullscreen, close]
  );

  const onAction = useCallback(
    (action: CardAction) => {
      const target = modeRef.current === "expanded" ? overlayView.current : view.current;
      if (action === "zoom-in") target?.zoomIn();
      else if (action === "zoom-out") target?.zoomOut();
      else if (action === "fit") target?.center();
      else if (action === "expand") expand();
      else if (action === "fullscreen") fullscreen();
      else close();
    },
    [expand, fullscreen, close]
  );

  const editable = !readOnly && onSelectionChange ? onSelectionChange : undefined;
  const viewProps = {
    selection,
    onSelectionChange: editable,
    confirmRefund,
    highlightedTypes,
    markedTypes,
    getNodeShareUrl,
    initialView: "fit" as const,
    tooltipStrategy: "fixed" as const,
  };

  const inlineActions: CardAction[] =
    mode === "fullscreen" ? ["zoom-in", "zoom-out", "fit", "exit-fullscreen"] : ["zoom-in", "zoom-out", "fit", "expand", "fullscreen"];

  return (
    <div
      ref={root}
      tabIndex={0}
      role="group"
      aria-label={label}
      data-skill-tree-card=""
      data-card-mode={mode}
      data-read-only={editable ? "false" : "true"}
      className={["outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80", className].filter(Boolean).join(" ")}
      style={{
        position: "relative",
        overflow: "hidden",
        // Drags and pinches on the card move the tree, not the page.
        touchAction: "none",
        background: backdrop,
        width: fallback.width ? DEFAULT_CARD_SIZE : "100%",
        height: fallback.height ? DEFAULT_CARD_SIZE : "100%",
        ...style,
      }}
    >
      <SkillTreeView ref={view} {...viewProps} style={{ position: "absolute", inset: 0 }} />
      {controls && <CardControls actions={inlineActions} locale={locale} onAction={onAction} />}
      {mode === "expanded" && (
        <CardOverlay label={label} background={backdrop} onClose={close}>
          <SkillTreeView ref={overlayView} {...viewProps} style={{ position: "absolute", inset: 0 }} />
          <CardControls actions={["zoom-in", "zoom-out", "fit", "close"]} locale={locale} onAction={onAction} />
        </CardOverlay>
      )}
    </div>
  );
});

// An action in one card doesn't re-render another (given stable props).
export const SkillTreeCard = memo(SkillTreeCardBase);

type CardOverlayProps = { label: string; background: string; onClose: () => void; children: ReactNode };

// The expanded card: a dialog over the page, about 90% of the viewport,
// rendered at the end of <body> so no ancestor of the card can clip it. It
// keeps focus inside, and Esc, the close button or a click outside closes it.
const CardOverlay = ({ label, background, onClose, children }: CardOverlayProps) => {
  const panel = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panel.current?.focus({ preventScroll: true });
  }, []);

  // The page behind doesn't scroll while the overlay is open.
  useEffect(() => {
    const el = backdrop.current;
    if (!el) return;
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener("wheel", stop, { passive: false });
    return () => el.removeEventListener("wheel", stop);
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab" || !panel.current) return;
    const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panel.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={backdrop}
      data-skill-tree-card-overlay=""
      className="fixed inset-0 flex items-center justify-center bg-black/70"
      style={{ zIndex: 10000, touchAction: "none", overscrollBehavior: "contain" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="relative overflow-hidden rounded-sm border border-white/15 shadow-2xl outline-none"
        style={{ width: "90vw", height: "90vh", background }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
