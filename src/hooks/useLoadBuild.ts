import { useCallback } from "react";
import { useTranslation } from "next-i18next/pages";

import {
  SelectionCleanup,
  SkillBuild,
  buildToSelection,
  getNodeName,
  isDifferentTreeVersion,
  sanitizeSelection,
} from "@enshrouded/core";
import { useAppDispatch } from "@/redux/hooks";
import {
  initConnectedPaths,
  loadSelectedSkills,
  setPlayerLevel,
  setUnlockedBiomes,
} from "@/redux/skills/skills.slice";
import { gameToast } from "@/utils/gameToast";

// Fit a selection to the current tree, load it, and tell the user what changed.
export const useApplySelection = () => {
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation("common");

  const skillName = useCallback(
    (id: string) => getNodeName(id, i18n.resolvedLanguage ?? i18n.language),
    [i18n]
  );

  const reportCleanup = useCallback(
    (cleanup: SelectionCleanup) => {
      const names = (ids: string[]) => ids.map(skillName).join(", ");
      if (cleanup.removed.length) gameToast.warning(t("toasts.skillsRemoved", { names: names(cleanup.removed) }));
      if (cleanup.disconnected.length) gameToast.warning(t("toasts.skillsDisconnected", { names: names(cleanup.disconnected) }));
      if (cleanup.clamped.length) gameToast.warning(t("toasts.skillLevelsLowered", { names: names(cleanup.clamped) }));
    },
    [t, skillName]
  );

  return useCallback(
    (selection: { [id: string]: number }) => {
      const cleanup = sanitizeSelection(selection);
      dispatch(loadSelectedSkills(cleanup.selection));
      dispatch(initConnectedPaths(Object.keys(cleanup.selection)));
      reportCleanup(cleanup);
      return cleanup;
    },
    [dispatch, reportCleanup]
  );
};

// Load a shared or imported build (any tree version) into the planner.
export const useLoadBuild = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation("common");
  const applySelection = useApplySelection();

  return useCallback(
    (build: SkillBuild) => {
      applySelection(buildToSelection(build));
      if (build.playerLevel != null) dispatch(setPlayerLevel(build.playerLevel));
      if (build.unlockedBiomes != null) dispatch(setUnlockedBiomes(build.unlockedBiomes));
      if (isDifferentTreeVersion(build)) gameToast.warning(t("toasts.differentTreeVersion"));
    },
    [applySelection, dispatch, t]
  );
};
