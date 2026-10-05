import { useEffect } from "react";
import { gameToast } from "@/utils/gameToast";
import { useTranslation } from "next-i18next";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { clearCodeImported } from "@/redux/skills/skills.slice";
import { useApplySelection, useLoadBuild } from "@/hooks/useLoadBuild";
import { convertHashToJson, sanitizeSelection } from "@/utils/utils";

const InitSkills = () => {
  const code = useAppSelector((state) => state.skill.codeImported);
  const selectedSkills = useAppSelector((state) => state.skill.selectedSkills);
  const { t } = useTranslation("common");
  const dispatch = useAppDispatch();
  const loadBuild = useLoadBuild();
  const applySelection = useApplySelection();

  // A session restored after a game update may reference retired or now
  // unreachable skills; fit it to the current tree once on load.
  useEffect(() => {
    if (code) return;
    const cleanup = sanitizeSelection(selectedSkills);
    if (cleanup.removed.length || cleanup.disconnected.length || cleanup.clamped.length) {
      applySelection(selectedSkills);
    }
  }, []);

  useEffect(() => {
    if (code) {
      try {
        const build = convertHashToJson(code);
        if (!Array.isArray(build.skills)) throw new Error("Invalid code");
        loadBuild(build);
        dispatch(clearCodeImported());
      } catch {
        gameToast.error(t("toasts.invalidCode"));
      }
    }
  }, [code]);

  return null;
};

export default InitSkills;
