import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from "react";
import { TransformComponent, TransformWrapper, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

// Scales of the pan/zoom layer (content pixels to screen pixels). The content
// is drawn at TREE_TO_PX, so the initial 2 shows 0.5 screen px per tree unit.
export const INITIAL_SCALE = 2;
export const MIN_SCALE = 2;
export const MAX_SCALE = 5;
const BUTTON_STEP = 0.5;
// Each wheel notch zooms by this share of the current scale, so the wheel
// feels the same at every zoom: 6 notches from the planner's initial scale
// to the max.
const WHEEL_ZOOM_PER_NOTCH = 0.17;
// Wheel distance of one notch of a typical mouse, in px.
const NOTCH_PX = 100;
// A fast or free-spinning wheel can send many notches in one event. Count at
// most this many, so the zoom doesn't jump to a limit.
const MAX_NOTCHES = 2;
// How fast a trackpad pinch zooms, compared with the fingers (1: the tree
// grows as much as they spread).
const PINCH_SPEED = 1;
// A drag counts as a pan (for onUserMove) once it has moved this far, in
// screen px, so a click with a slight wobble is still a click.
const PAN_START_PX = 6;
// The fitted view leaves this share of the container around the tree.
const FIT_PADDING = 0.04;
// Before the container is measured: a scale below any real fit.
const UNMEASURED_FIT = 0.05;

export type PanZoomHandle = {
  zoomIn: (step?: number) => void;
  zoomOut: (step?: number) => void;
  center: (animationMs?: number) => void;
  zoomToElement: (element: Element, animationMs: number) => void;
};

export type FitSize = { width: number; height: number };

type PanZoomProps = {
  children: ReactNode;
  // Called once the layer can move, to set the first view.
  onReady: () => void;
  // Changing it sets the first view again (e.g. a new ?focus= node).
  focusKey?: string;
  // Content size (px at scale 1) to fit in the container. When set, the first
  // view, center() and the minimum zoom all show exactly this much, and the
  // buttons zoom by a share of the current scale, so they feel the same at
  // any container size. Unset: the planner's fixed scales.
  fitSize?: FitSize;
  // Called when the user starts to move the view: a drag that pans, a pinch
  // or a wheel zoom. Not for moves made through the handle.
  onUserMove?: () => void;
};

// The pointer of a mouse or one-finger touch event (programmatic moves have none).
const pointOf = (event: MouseEvent | TouchEvent | undefined): { clientX: number; clientY: number } | null =>
  !event ? null : "touches" in event ? (event.touches[0] ?? null) : event;

// The factor (> 1) one wheel event zooms by. Chrome sends a trackpad pinch
// as Ctrl + wheel events of deltaY = 100 × ln(finger scale), each well under
// half a notch, so the zoom follows the fingers. Ctrl + a mouse wheel sends
// whole notches and zooms like the plain wheel. Some browsers (e.g. Firefox)
// can report lines (3 per notch) or pages instead of px.
const wheelZoomFactor = ({ deltaY, deltaMode, ctrlKey }: WheelEvent) => {
  const distance = Math.abs(deltaY);
  const inPx = deltaMode === WheelEvent.DOM_DELTA_PIXEL;
  if (inPx && ctrlKey && distance < NOTCH_PX / 2) return Math.exp((PINCH_SPEED * distance) / 100);
  const notches = inPx ? distance / NOTCH_PX : deltaMode === WheelEvent.DOM_DELTA_LINE ? distance / 3 : MAX_NOTCHES;
  return (1 + WHEEL_ZOOM_PER_NOTCH) ** Math.min(notches, MAX_NOTCHES);
};

const fitScaleFor = (el: Element | null | undefined, fit: FitSize) => {
  if (!el) return null;
  const { width, height } = el.getBoundingClientRect();
  if (width < 1 || height < 1) return null;
  return Math.min(width / fit.width, height / fit.height) * (1 - FIT_PADDING);
};

// Pan (drag), zoom (wheel, pinch, buttons) and animated moves, by
// react-zoom-pan-pinch around the tree's <svg>. The content box is the tree
// plus a margin, and the library keeps it on screen, which bounds panning.
// It fills its container and re-centers when the container is resized.
export const PanZoom = forwardRef<PanZoomHandle, PanZoomProps>(function PanZoom({ children, onReady, focusKey, fitSize, onUserMove }, ref) {
  const zoom = useRef<ReactZoomPanPinchRef | null>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const onUserMoveRef = useRef(onUserMove);
  onUserMoveRef.current = onUserMove;
  // Where the current drag started, until it moves far enough to be a pan.
  const panStart = useRef<{ x: number; y: number } | null>(null);
  const fitRef = useRef(fitSize);
  fitRef.current = fitSize;
  const fitMode = fitSize !== undefined;

  // Fit mode: the fitted scale for the current container size, which is also
  // the library's minimum zoom.
  const [fitScale, setFitScale] = useState<number | null>(null);
  const centerView = (animationMs?: number) => {
    const fit = fitRef.current;
    if (!fit) {
      zoom.current?.centerView(INITIAL_SCALE, animationMs);
      return;
    }
    const scale = fitScaleFor(wrapper.current, fit);
    if (scale == null) return;
    setFitScale(scale);
    // The library clamps to its minimum, which the new props only update
    // after the next render.
    const setup = zoom.current?.instance.setup;
    if (setup) setup.minScale = Math.min(setup.minScale, scale);
    zoom.current?.centerView(scale, animationMs);
  };
  const centerRef = useRef(centerView);
  centerRef.current = centerView;

  // The library adds a fixed amount per button press. In fit mode, scale it
  // with the zoom (the planner's amount at its initial zoom).
  const relative = (step: number) => {
    if (!fitRef.current) return step;
    const scale = zoom.current?.instance.state.scale ?? INITIAL_SCALE;
    return (step * scale) / INITIAL_SCALE;
  };

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: (step = BUTTON_STEP) => zoom.current?.zoomIn(relative(step)),
      zoomOut: (step = BUTTON_STEP) => zoom.current?.zoomOut(relative(step)),
      center: (animationMs) => centerRef.current(animationMs),
      zoomToElement: (element, animationMs) =>
        // The library measures any element with getBoundingClientRect, SVG included.
        zoom.current?.zoomToElement(element as HTMLElement, MAX_SCALE, animationMs, "easeOut"),
    }),
    []
  );

  // A new size: show the initial view again, as a window resize used to.
  useEffect(() => {
    const el = wrapper.current?.parentElement;
    if (!el || typeof ResizeObserver === "undefined") return;
    let last: string | undefined;
    const observer = new ResizeObserver(([entry]) => {
      const size = `${Math.round(entry.contentRect.width)}x${Math.round(entry.contentRect.height)}`;
      if (last !== undefined && size !== last) centerRef.current(0);
      last = size;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The library zooms by its wheel step times the event's deltaY. Set the step
  // just before its own wheel listener (inside this element) reads it, so the
  // event multiplies the scale by wheelZoomFactor (divides it, zooming out).
  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      const instance = zoom.current?.instance;
      if (!instance || event.deltaY === 0) return;
      const scale = instance.state.scale;
      const factor = wheelZoomFactor(event);
      const change = event.deltaY < 0 ? scale * (factor - 1) : scale * (1 - 1 / factor);
      instance.setup.wheel.step = change / Math.abs(event.deltaY);
    };
    el.addEventListener("wheel", onWheel, { capture: true, passive: true });
    return () => el.removeEventListener("wheel", onWheel, { capture: true });
  }, []);

  const ready = useRef(false);
  useEffect(() => {
    if (ready.current) onReadyRef.current();
  }, [focusKey]);

  const minScale = fitMode ? (fitScale ?? UNMEASURED_FIT) : MIN_SCALE;

  return (
    <div ref={wrapper} style={{ position: "absolute", inset: 0 }}>
      <TransformWrapper
        minScale={minScale}
        maxScale={MAX_SCALE}
        initialScale={fitMode ? minScale : INITIAL_SCALE}
        // Fitted to a wide or tall container, the content is narrower than it
        // in one direction: keep it centered there instead of free to slide.
        centerZoomedOut={fitMode}
        doubleClick={{ disabled: true }}
        onPanningStart={(_, event) => {
          const point = pointOf(event);
          panStart.current = point ? { x: point.clientX, y: point.clientY } : null;
        }}
        onPanning={(_, event) => {
          const start = panStart.current;
          const point = pointOf(event);
          if (!start || !point || Math.hypot(point.clientX - start.x, point.clientY - start.y) < PAN_START_PX) return;
          panStart.current = null;
          onUserMoveRef.current?.();
        }}
        onPanningStop={() => (panStart.current = null)}
        onPinchStart={() => onUserMoveRef.current?.()}
        onWheelStart={() => onUserMoveRef.current?.()}
        onInit={(instance) => {
          zoom.current = instance;
          requestAnimationFrame(() => {
            ready.current = true;
            onReadyRef.current();
          });
        }}
      >
        <TransformComponent
          wrapperStyle={{ width: "100%", height: "100%" }}
          contentStyle={{ display: "flex", flexWrap: "wrap", width: "fit-content", height: "fit-content", margin: 0, padding: 0, transformOrigin: "0% 0%" }}
        >
          {children}
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
});
