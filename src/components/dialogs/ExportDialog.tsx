import { Fragment, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Dialog, Transition } from "@headlessui/react";

import { classNames, convertJsonToHash } from "@/utils/utils";
import { useAppSelector } from "@/redux/hooks";
import CopyInput from "../shared/CopyInput";

type PropsType = {
  open: boolean;
  onClose: () => void;
};

const BASE_URL =
  process.env.BASE_URL || "https://enshrouded-skill-tree.vercel.app/";

const ExportDialog = ({ open, onClose }: PropsType) => {
  const [shareURL, setShareURL] = useState("");
  const [shortURL, setShortURL] = useState("");
  const [copied, setCopied] = useState("");
  const selectedSkills = useAppSelector((state) => state.skill.selectedSkills);

  const exportHandler = () => {
    const tmpCode = convertJsonToHash(selectedSkills);
    const url = `${BASE_URL}?code=${tmpCode}`;
    setShareURL(url);
    navigator.clipboard.writeText(url);
    toast.success("Share URL copied successfully");
    setCopied("code");
  };

  const exportAPIHandler = async () => {
    const tmpCode = convertJsonToHash(selectedSkills);
    const response = await fetch("/api/code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: tmpCode }),
    });
    const result = await response.json();
    const url = `${BASE_URL}?shortCode=${result.code}`;
    setShortURL(url);
    navigator.clipboard.writeText(url);
    toast.success("Share URL copied successfully");
    setCopied("api");
  };

  useEffect(() => {
    if (open) {
      if (copied) return;
      if (selectedSkills.length === 0) {
        toast.error("No skills allocated!");
        onClose();
      } else {
        exportHandler();
      }
    }
  }, [open, selectedSkills, copied]);

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
                  Export skills
                </Dialog.Title>
                <div className="mt-5 flex flex-col gap-3">
                  <CopyInput
                    label="Default Url"
                    copied={copied === "code"}
                    onCopy={() => setCopied("code")}
                    value={shareURL}
                  />
                  {shortURL ? (
                    <CopyInput
                      label="Short Url"
                      copied={copied === "api"}
                      onCopy={() => setCopied("api")}
                      value={shortURL}
                    />
                  ) : (
                    <button
                      className={classNames(
                        "rounded-lg border border-purple-600 h-8 text-purple-600",
                        "hover:bg-purple-100"
                      )}
                      onClick={exportAPIHandler}
                    >
                      Generate short URL
                    </button>
                  )}

                  <div className="mt-4 w-full flex justify-end">
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

export default ExportDialog;
