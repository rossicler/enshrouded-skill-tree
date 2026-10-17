import { useCallback, useRef, useState } from "react";
import { useTranslation } from "next-i18next/pages";
import { MAX_PLAYER_LEVEL, SkillNodes, getMaxSkillPoints, getSkillName, type SkillSelection } from "@enshrouded/core";
import {
  SkillTreeProvider,
  SkillTreeView,
  type RefundRequest,
  type SkillTreeNotice,
  type SkillTreeViewHandle,
} from "@enshrouded/react";

import { SKILL_TREE_ASSETS } from "@/constants/assets";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { loadSelectedSkills } from "@/redux/skills/skills.slice";
import { gameToast } from "@/utils/gameToast";
import { useHardcapEnabled } from "@/utils/settings";
import { playSound } from "@/utils/sounds";
import RefundConfirmDialog from "./dialogs/RefundConfirmDialog";
import SkillCapDialog from "./dialogs/SkillCapDialog";
import HUD from "./hud/HUD";

type SkillPlannerProps = {
  dbAvailable?: boolean;
  focusNodeId?: string;
};

// The site's planner: the package's tree view, fed from the Redux store
// (persisted in sessionStorage), with the site's dialogs, toasts and HUD.
const SkillPlanner = ({ dbAvailable = false, focusNodeId }: SkillPlannerProps) => {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const dispatch = useAppDispatch();
  const selection = useAppSelector((state) => state.skill.selectedSkills);
  const searchResults = useAppSelector((state) => state.skill.searchSkillResults);
  const unlockedBiomes = useAppSelector((state) => state.skill.unlockedBiomes);
  const playerLevel = useAppSelector((state) => state.skill.playerLevel ?? MAX_PLAYER_LEVEL);
  const hardcapEnabled = useHardcapEnabled();
  const maxSkillPoints = getMaxSkillPoints({ playerLevel, unlockedBiomes });
  const view = useRef<SkillTreeViewHandle>(null);
  const [showCapWarning, setShowCapWarning] = useState(false);
  const [pendingRefund, setPendingRefund] = useState<{ count: number; resolve: (confirmed: boolean) => void } | null>(null);

  // Seeds the search box, so it must be the same name the search corpus indexes.
  const focusType = focusNodeId ? SkillNodes.nodes[focusNodeId]?.type : undefined;
  const focusNodeName = focusType ? getSkillName(focusType, locale) : undefined;

  const onSelectionChange = useCallback((next: SkillSelection) => dispatch(loadSelectedSkills(next)), [dispatch]);

  const confirmRefund = useCallback(
    ({ removed }: RefundRequest) =>
      new Promise<boolean>((resolve) => setPendingRefund({ count: removed.length - 1, resolve })),
    []
  );
  const closeRefund = (confirmed: boolean) => {
    pendingRefund?.resolve(confirmed);
    setPendingRefund(null);
  };

  const onNotice = useCallback(
    (notice: SkillTreeNotice) => {
      if (notice.type === "hard-cap") setShowCapWarning(true);
      if (notice.type === "link-copied") gameToast.success(t("toasts.shareUrlCopied"));
    },
    [t]
  );

  const getNodeShareUrl = useCallback(
    (nodeId: string) => `${window.location.origin}${window.location.pathname}?focus=${nodeId}`,
    []
  );

  return (
    <SkillTreeProvider
      locale={locale}
      assetBaseUrl={SKILL_TREE_ASSETS}
      sound={playSound}
      hardCap={hardcapEnabled ? maxSkillPoints : undefined}
      onNotice={onNotice}
    >
      <SkillCapDialog open={showCapWarning} onClose={() => setShowCapWarning(false)} />
      <RefundConfirmDialog
        open={pendingRefund !== null}
        count={pendingRefund?.count ?? 0}
        onConfirm={() => closeRefund(true)}
        onCancel={() => closeRefund(false)}
      />
      <SkillTreeView
        ref={view}
        style={{ position: "absolute", inset: 0 }}
        selection={selection}
        onSelectionChange={onSelectionChange}
        confirmRefund={confirmRefund}
        highlightedTypes={searchResults}
        initialFocusNodeId={focusNodeId}
        getNodeShareUrl={getNodeShareUrl}
      />
      <HUD view={view} dbAvailable={dbAvailable} initialSearchText={focusNodeName} />
    </SkillTreeProvider>
  );
};

export default SkillPlanner;
