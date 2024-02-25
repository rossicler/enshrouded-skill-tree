import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  clearCodeImported,
  initConnectedPaths,
  loadSelectedSkills,
} from "@/redux/skills/skills.slice";
import { convertHashToJson } from "@/utils/utils";

const InitSkills = () => {
  const code = useAppSelector((state) => state.skill.codeImported);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (code) {
      try {
        const initSkills = convertHashToJson(code);
        dispatch(loadSelectedSkills(initSkills));
        dispatch(initConnectedPaths(initSkills));
        if (code) {
          dispatch(clearCodeImported());
        }
      } catch {
        toast.error("Invalid code");
      }
    }
  }, [code]);

  return null;
};

export default InitSkills;
