import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

import { GameButton, type GameButtonProps } from "./GameButton";
import { GamePanel } from "./GamePanel";
import { classNames } from "./shared";

// Open state that a parent may control (open + onOpenChange) or leave to the
// component. A parent controls it to let only one panel be open at a time.
export const useControllableOpen = (open: boolean | undefined, onOpenChange: ((open: boolean) => void) | undefined) => {
  const [innerOpen, setInnerOpen] = useState(false);
  const controlled = open !== undefined;
  const isOpen = controlled ? open : innerOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      if (!controlled) setInnerOpen(next);
      onOpenChange?.(next);
    },
    [controlled, onOpenChange]
  );
  return [isOpen, setOpen] as const;
};

export type HudToggleProps = {
  // The button's content.
  label: ReactNode;
  // The panel's content, shown below the button while open.
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // Classes for the wrapper (className) and for the button (buttonClassName).
  className?: string;
  buttonClassName?: string;
  // A data attribute on the panel's content, e.g. "stats" -> data-panel="stats".
  panelName: string;
  // The panel's maximum height, as a class. It replaces the default, which
  // suits one open panel: a host that shows several at once passes a smaller one.
  panelSizeClassName?: string;
} & Omit<GameButtonProps, "children" | "onClick" | "className" | "aria-expanded" | "aria-controls">;

const DEFAULT_PANEL_SIZE = "max-h-[min(24rem,45dvh)]";

// A HUD button with a panel just below it. One click opens the panel, a second
// click (or Escape) closes it. It is not a dialog: nothing else is blocked, so
// the skill tree stays usable while it is open, and a click on the tree
// doesn't close it. A tall panel scrolls inside itself instead of running off
// a short screen.
export const HudToggle = ({
  label,
  children,
  open,
  onOpenChange,
  className,
  buttonClassName,
  panelName,
  panelSizeClassName = DEFAULT_PANEL_SIZE,
  ...buttonProps
}: HudToggleProps) => {
  const [isOpen, setOpen] = useControllableOpen(open, onOpenChange);
  const panelId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      // Escape inside a dialog belongs to that dialog.
      if (event.target instanceof Element && event.target.closest('[role="dialog"]')) return;
      const wrapper = wrapperRef.current;
      const hadFocus = wrapper?.contains(document.activeElement) ?? false;
      setOpen(false);
      // Focus was in the panel, which is about to go: hand it back to the button.
      if (hadFocus) wrapper?.querySelector<HTMLButtonElement>("button[aria-controls]")?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, setOpen]);

  return (
    <div ref={wrapperRef} className={classNames("relative flex flex-col gap-2", className)}>
      <GameButton
        type="button"
        {...buttonProps}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className={buttonClassName}
        onClick={() => setOpen(!isOpen)}
      >
        {label}
      </GameButton>
      {isOpen && (
        <GamePanel>
          <div
            id={panelId}
            data-panel={panelName}
            className={classNames("px-5 py-3 overflow-y-auto overscroll-contain", panelSizeClassName)}
          >
            {children}
          </div>
        </GamePanel>
      )}
    </div>
  );
};
