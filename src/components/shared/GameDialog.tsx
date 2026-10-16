import { ReactNode } from "react";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";

import { classNames } from "@/utils/utils";

type PropsType = {
  open: boolean;
  onClose: () => void;
  /** Exposed as data-dialog on the panel, for tests. */
  name: string;
  /** Classes for the panel, typically its max width. */
  className?: string;
  children: ReactNode;
};

// The modal shell every dialog shares: a dimmed backdrop and a centered panel
// that fades and scales in.
const GameDialog = ({ open, onClose, name, className, children }: PropsType) => (
  <Dialog open={open} onClose={onClose} className="relative z-50">
    <DialogBackdrop
      transition
      className={classNames(
        "fixed inset-0 bg-black/50",
        "duration-300 ease-out data-closed:opacity-0",
        "data-leave:duration-200 data-leave:ease-in",
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
            className,
          )}
        >
          {children}
        </DialogPanel>
      </div>
    </div>
  </Dialog>
);

export default GameDialog;
