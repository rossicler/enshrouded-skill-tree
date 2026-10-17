import { forwardRef, useEffect, useImperativeHandle, useRef, type ReactNode } from "react";
import { TransformComponent, TransformWrapper, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

// Scales of the pan/zoom layer (content pixels to screen pixels). The content
// is drawn at TREE_TO_PX, so the initial 2 shows 0.5 screen px per tree unit.
export const INITIAL_SCALE = 2;
export const MIN_SCALE = 2;
export const MAX_SCALE = 5;
const BUTTON_STEP = 0.5;

export type PanZoomHandle = {
  zoomIn: (step?: number) => void;
  zoomOut: (step?: number) => void;
  center: (animationMs?: number) => void;
  zoomToElement: (element: Element, animationMs: number) => void;
};

type PanZoomProps = {
  children: ReactNode;
  // Called once the layer can move, to set the first view.
  onReady: () => void;
  // Changing it sets the first view again (e.g. a new ?focus= node).
  focusKey?: string;
};

// Pan (drag), zoom (wheel, pinch, buttons) and animated moves, by
// react-zoom-pan-pinch around the tree's <svg>. The content box is the tree
// plus a margin, and the library keeps it on screen, which bounds panning.
// It fills its container and re-centers when the container is resized.
export const PanZoom = forwardRef<PanZoomHandle, PanZoomProps>(function PanZoom({ children, onReady, focusKey }, ref) {
  const zoom = useRef<ReactZoomPanPinchRef | null>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: (step = BUTTON_STEP) => zoom.current?.zoomIn(step),
      zoomOut: (step = BUTTON_STEP) => zoom.current?.zoomOut(step),
      center: (animationMs) => zoom.current?.centerView(INITIAL_SCALE, animationMs),
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
      if (last !== undefined && size !== last) zoom.current?.centerView(INITIAL_SCALE, 0);
      last = size;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const ready = useRef(false);
  useEffect(() => {
    if (ready.current) onReadyRef.current();
  }, [focusKey]);

  return (
    <div ref={wrapper} style={{ position: "absolute", inset: 0 }}>
      <TransformWrapper
        minScale={MIN_SCALE}
        maxScale={MAX_SCALE}
        initialScale={INITIAL_SCALE}
        // Smooth wheel zoom multiplies the step by the wheel distance (about
        // 100 per notch), so 0.001 zooms about 0.1 per notch.
        wheel={{ step: 0.001 }}
        doubleClick={{ disabled: true }}
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
