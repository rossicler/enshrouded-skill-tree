import { useEffect } from "react";
import { gameToast } from "@/utils/gameToast";
import { useTranslation } from "next-i18next";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { clearCodeImported } from "@/redux/skills/skills.slice";
import { useApplySelection, useLoadBuild } from "@/hooks/useLoadBuild";
import { convertHashToJson, sanitizeSelection } from "@/utils/utils";

type PropsType = {
  // Share code from the page props. Known on the first render, unlike
  // codeImported, which Home's effect sets after this component's effects run.
  sharedCode?: string;
};

const InitSkills = ({ sharedCode }: PropsType) => {
  const code = useAppSelector((state) => state.skill.codeImported);
  const selectedSkills = useAppSelector((state) => state.skill.selectedSkills);
  const { t } = useTranslation("common");
  const dispatch = useAppDispatch();
  const loadBuild = useLoadBuild();
  const applySelection = useApplySelection();

  // A session restored after a game update may reference retired or now
  // unreachable skills; fit it to the current tree.
  const cleanUpSession = () => {
    const cleanup = sanitizeSelection(selectedSkills);
    if (cleanup.removed.length || cleanup.disconnected.length || cleanup.clamped.length) {
      applySelection(selectedSkills);
    }
  };

  // Once on load, unless a shared build is about to replace the session.
  useEffect(() => {
    if (!code && !sharedCode) cleanUpSession();
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
        // The session stays loaded, so it still needs fitting to the tree.
        cleanUpSession();
      }
    }
  }, [code]);

  return null;
};

export default InitSkills;
