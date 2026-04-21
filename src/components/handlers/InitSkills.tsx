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
import SkillNodes from "@/constants/Nodes";


const InitSkills = () => {
  const code = useAppSelector((state) => state.skill.codeImported);
  const { t } = useTranslation("common");
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (code) {
      try {
        const build = convertHashToJson(code);
        if (!Array.isArray(build.skills)) throw new Error("Invalid code");

        // Validate skill IDs
        const validSkills = build.skills.filter(
          (id) => SkillNodes.nodes[id] !== undefined
        );

        dispatch(loadSelectedSkills(validSkills));
        dispatch(initConnectedPaths(validSkills));
        if (build.playerLevel != null)
          dispatch(setPlayerLevel(build.playerLevel));
        if (build.unlockedBiomes != null)
          dispatch(setUnlockedBiomes(build.unlockedBiomes));
        dispatch(clearCodeImported());
      } catch {
        gameToast.error(t("toasts.invalidCode"));
      }
    }
  }, [code]);

  return null;
};

export default InitSkills;
