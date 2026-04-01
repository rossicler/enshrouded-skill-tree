import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { gameToast } from "@/utils/gameToast";
import { useTranslation } from "next-i18next";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  clearCodeImported,
  initConnectedPaths,
  loadSelectedSkills,
  setPlayerLevel,
  setUnlockedBiomes,
} from "@/redux/skills/skills.slice";
import { convertHashToJson } from "@/utils/utils";

const InitSkills = () => {
  const code = useAppSelector((state) => state.skill.codeImported);
  const { t } = useTranslation("common");
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (code) {
      try {
        const build = convertHashToJson(code);
        if (!Array.isArray(build.skills)) throw new Error("Invalid code");
        dispatch(loadSelectedSkills(build.skills));
        dispatch(initConnectedPaths(build.skills));
        if (build.playerLevel != null) dispatch(setPlayerLevel(build.playerLevel));
        if (build.unlockedBiomes != null) dispatch(setUnlockedBiomes(build.unlockedBiomes));
        dispatch(clearCodeImported());
      } catch {
        gameToast.error(t("toasts.invalidCode"));
      }
    }
  }, [code]);

  return null;
};

export default InitSkills;
