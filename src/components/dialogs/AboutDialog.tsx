import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { classNames } from "@/utils/utils";

type PropsType = {
  open: boolean;
  onClose: () => void;
};

const AboutDialog = ({ open, onClose }: PropsType) => {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  About
                </Dialog.Title>
                <div className="mt-5 text-black flex flex-col gap-5">
                  <p>
                    This tool was created solely to aid Enshrouded players in
                    sharing skill trees and builds conveniently. I'm not
                    affiliated with Keen Games and do not hold any rights to the
                    Enshrouded game.
                  </p>
                  <p>
                    This tool is open source and availble for anyone who wants
                    to contribute. If you're looking to contribute, you can go
                    to the{" "}
                    <a
                      className="text-purple-600 underline"
                      href="https://github.com/rossicler/enshrouded-skill-tree"
                      target="_blank"
                    >
                      GitHub repository
                    </a>{" "}
                    or you can join our discord server and reach out.
                  </p>
                  <p>
                    Special thanks to{" "}
                    <a
                      className="text-purple-600 underline"
                      href="https://www.youtube.com/@Glitchiz"
                      target="_blank"
                    >
                      @Glitchiz
                    </a>{" "}
                    for giving me some of the assets used in this tool.
                  </p>

                  <div className="w-full flex justify-end">
                    <button
                      className={classNames(
                        "inline-flex justify-center rounded-md border border-transparent",
                        "bg-purple-600 px-4 py-2 text-sm font-medium text-white",
                        "hover:bg-purple-400 focus:outline-none focus-visible:ring-2",
                        "focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                      )}
                      onClick={onClose}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AboutDialog;
