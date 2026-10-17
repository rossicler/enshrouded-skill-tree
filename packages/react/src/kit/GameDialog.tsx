import type { ReactNode } from "react";
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

// The modal shell: a dimmed backdrop and a centered panel that fades and
// scales in. Headless UI handles focus, Esc and clicks outside.
export const GameDialog = ({ open, onClose, name, className, children }: GameDialogProps) => (
  <Dialog open={open} onClose={onClose} className="relative z-50">
    <DialogBackdrop
      transition
      className={classNames(
        "fixed inset-0 bg-black/50",
        "duration-300 ease-out data-closed:opacity-0",
        "data-leave:duration-200 data-leave:ease-in"
      )}
    />
    <div className="fixed inset-0 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <DialogPanel
          transition
          data-dialog={name}
          className={classNames(
            "w-full transform overflow-visible text-left align-middle transition-all",
            "duration-300 ease-out data-closed:opacity-0 data-closed:scale-95",
            "data-leave:duration-200 data-leave:ease-in",
            className
          )}
        >
          {children}
        </DialogPanel>
      </div>
    </div>
  </Dialog>
);

// A GameDialog's title (an h3 in the kit's gold), which names the dialog for screen readers.
export const GameDialogTitle = ({ children, className }: { children: ReactNode; className?: string }) => (
  <DialogTitle
    as="h3"
    className={classNames("text-lg font-semibold leading-6 text-[#e8d5a3] drop-shadow-[0_0_4px_rgba(202,152,3,0.4)]", className)}
  >
    {children}
  </DialogTitle>
);
