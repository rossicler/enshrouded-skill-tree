import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { gameToast } from "@/utils/gameToast";
import { useTranslation } from "next-i18next";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  clearCodeImported,
  initConnectedPaths,
  loadSelectedSkills,
} from "@/redux/skills/skills.slice";
import { convertHashToJson } from "@/utils/utils";

const InitSkills = () => {
  const code = useAppSelector((state) => state.skill.codeImported);
  const { t } = useTranslation("common");
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
        gameToast.error(t("toasts.invalidCode"));
      }
    }
  }, [code]);

  return null;
};

export default InitSkills;
