import { Fragment, useMemo } from "react";
import { Dialog, Transition } from "@headlessui/react";

import { classNames } from "@/utils/utils";
import { useAppSelector } from "@/redux/hooks";
import { getStatsFromSkills } from "@/utils/stats";
import { BasicStats, StatsType } from "@/constants/Stats";

type PropsType = {
  open: boolean;
  onClose: () => void;
};

const StatsDialog = ({ open, onClose }: PropsType) => {
  const skillsSelected = useAppSelector((state) => state.skill.selectedSkills);
  const stats = useMemo(
    () => getStatsFromSkills(skillsSelected),
    [skillsSelected]
  );

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
              <Dialog.Panel className="w-full max-w-xs transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-semibold leading-6 text-gray-900"
                >
                  Stats summary
                </Dialog.Title>
                <div className="mt-5 text-black flex gap-5 w-full">
                  <div className="flex flex-col gap-5 w-full">
                    <h3 className="font-medium">Basic</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 w-full text-sm justify-between">
                      {Object.keys(BasicStats).map((stat) => (
                        <div key={stat} className="flex justify-between">
                          <span>{BasicStats[stat as StatsType].name}</span>
                          <span>{stats[stat as StatsType] ?? 0} </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="w-full flex justify-end mt-6">
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
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default StatsDialog;
