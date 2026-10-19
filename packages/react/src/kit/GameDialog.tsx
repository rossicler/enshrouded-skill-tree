import { useEffect, useRef, useState, type ReactNode } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";

import { classNames } from "./shared";

export type GameDialogProps = {
  open: boolean;
  onClose: () => void;
  // Exposed as data-dialog on the panel, for tests.
  name: string;
  // Classes for the panel, typically its max width.
  className?: string;
  // Usually a GamePanel with a DialogTitle (from @headlessui/react) inside.
  children: ReactNode;
};

const isTransition = (animation: Animation) =>
  typeof CSSTransition === "undefined" || animation instanceof CSSTransition;

// Resolves once none of the elements has a CSS transition left to run. It
// looks again after every wait, because a transition can start or restart
// while it waits (a slow render can apply the closing styles late).
async function transitionsEnded(elements: (Element | null)[]) {
  for (;;) {
    const running = elements
      .flatMap((el) => el?.getAnimations?.() ?? [])
      .filter((a) => isTransition(a) && a.playState !== "finished" && a.playState !== "idle");
    if (running.length === 0) return;
    await Promise.allSettled(running.map((a) => a.finished));
  }
}

// The modal shell: a dimmed backdrop and a centered panel that fades and
// scales in. Headless UI handles focus, Esc and clicks outside.
//
// The enter and leave transitions are plain CSS (@starting-style to enter,
// data-leaving to leave) rather than Headless UI's `transition` prop. Headless
// UI 2.2 can leave a dialog mounted for good, invisible and covering the page,
// when it closes during its enter transition while React is busy with a large
// render (a reset or an imported build redrawing the tree): the cancelled
// transition waits on stale animations, then gives up because the new ones are
// still running, and nothing tries again.
export const GameDialog = ({ open, onClose, name, className, children }: GameDialogProps) => {
  // Stays true until the leave transition ends, so the dialog can fade out.
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  const leaving = mounted && !open;
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!leaving) return;
    let cancelled = false;
    transitionsEnded([backdropRef.current, panelRef.current]).then(() => {
      if (!cancelled) setMounted(false);
    });
    return () => {
      cancelled = true;
    };
  }, [leaving]);

  return (
    <Dialog open={mounted} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        ref={backdropRef}
        data-leaving={leaving ? "" : undefined}
        className={classNames(
          "fixed inset-0 bg-black/50 transition-opacity",
          "duration-300 ease-out starting:opacity-0",
          "data-leaving:opacity-0 data-leaving:duration-200 data-leaving:ease-in"
        )}
      />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <DialogPanel
            ref={panelRef}
            data-dialog={name}
            data-leaving={leaving ? "" : undefined}
            className={classNames(
              "w-full transform overflow-visible text-left align-middle transition-all",
              "duration-300 ease-out starting:opacity-0 starting:scale-95",
              "data-leaving:opacity-0 data-leaving:scale-95 data-leaving:duration-200 data-leaving:ease-in",
              "data-leaving:pointer-events-none",
              className
            )}
          >
            {children}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

// A GameDialog's title (an h3 in the kit's gold), which names the dialog for screen readers.
export const GameDialogTitle = ({ children, className }: { children: ReactNode; className?: string }) => (
  <DialogTitle
    as="h3"
    className={classNames("text-lg font-semibold leading-6 text-[#e8d5a3] drop-shadow-[0_0_4px_rgba(202,152,3,0.4)]", className)}
  >
    {children}
  </DialogTitle>
);
