import { useCallback } from "react";
import { useTranslation } from "next-i18next";

import SkillNodes, { RETIRED_NODES } from "@/constants/Nodes";
import { isDifferentTreeVersion } from "@/constants/skillTreeVersion";
import { useAppDispatch } from "@/redux/hooks";
import {
  initConnectedPaths,
  loadSelectedSkills,
  setPlayerLevel,
  setUnlockedBiomes,
} from "@/redux/skills/skills.slice";
import { gameToast } from "@/utils/gameToast";
import { usesGameText } from "@/utils/skillText";
import {
  BuildData,
  SelectionCleanup,
  buildToSelectedSkills,
  humanizeKey,
  sanitizeSelection,
} from "@/utils/utils";

// Fit a selection to the current tree, load it, and tell the user what changed.
export const useApplySelection = () => {
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation(["common", "nodes"]);

  const skillName = useCallback(
    (id: string) => {
      const node = SkillNodes.nodes[id];
      if (!node) return RETIRED_NODES[id]?.name ?? `#${id}`;
      const language = i18n.resolvedLanguage ?? i18n.language;
      const key = usesGameText(SkillNodes.types[node.type], language) ? "game.name" : "name";
      return String(t(`${node.type}.${key}`, { ns: "nodes", defaultValue: humanizeKey(node.type) }));
    },
    [t, i18n]
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
    (build: BuildData) => {
      applySelection(buildToSelectedSkills(build));
      if (build.playerLevel != null) dispatch(setPlayerLevel(build.playerLevel));
      if (build.unlockedBiomes != null) dispatch(setUnlockedBiomes(build.unlockedBiomes));
      if (isDifferentTreeVersion(build)) gameToast.warning(t("toasts.differentTreeVersion"));
    },
    [applySelection, dispatch, t]
  );
};
