import { FormEvent, Fragment, useState } from "react";
import { toast } from "react-toastify";
import { Dialog, Transition } from "@headlessui/react";

import { classNames } from "@/utils/utils";

type PropsType = {
  open: boolean;
  onClose: () => void;
  onImport: (code: string) => void;
};

const CODE_ARG = "code=";

const ImportDialog = ({ open, onClose, onImport }: PropsType) => {
  const [url, setUrl] = useState("");

  const importHandler = (e: FormEvent) => {
    e.preventDefault();

    let code = "";
    if (url.includes(CODE_ARG)) {
      const idx = url.indexOf(CODE_ARG);
      code = url.substring(idx + CODE_ARG.length);
    }

    if (code) {
      onImport(code);
      setUrl("");
      onClose();
    } else {
      toast.error("Invalid url!");
    }
  };

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
                  Import skills
                </Dialog.Title>
                <form className="mt-5" onSubmit={importHandler}>
                  <input
                    className="w-full h-10 border border-purple-600 rounded-lg outline-purple-600 text-black py-1 px-2"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />

                  <div className="mt-4">
                    <button
                      type="submit"
                      className={classNames(
                        "inline-flex justify-center rounded-md border border-transparent",
                        "bg-purple-600 px-4 py-2 text-sm font-medium text-white",
                        "hover:bg-purple-400 focus:outline-none focus-visible:ring-2",
                        "focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                      )}
                    >
                      Import
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ImportDialog;
