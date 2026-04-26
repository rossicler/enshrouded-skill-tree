import { useEffect, useMemo, useRef, useState } from "react";
import { TransformComponent, TransformWrapper, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { useTranslation } from "next-i18next";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  addConnectedPaths,
  decrementSelectedSkill,
  incrementSelectedSkill,
  loadConnectedPaths,
  removePathsConnectedTo,
  removeSelectedSkill,
} from "@/redux/skills/skills.slice";
import Nodes, { Node, getMaxLevel } from "../constants/Nodes";

export type SkillAction = "primary" | "secondary";
import { computeMaxSkillPoints } from "../constants/Biomes";
import CoreCircle from "./CoreCircle";
import SkillNode from "./SkillNode";
import SkillTooltip from "./SkillTooltip";
import SkillPaths from "./SkillPaths";
import { getSkillsToRemove } from "../utils/utils";
import { playSound } from "../utils/sounds";
import { isHardcapEnabled } from "../utils/settings";
import HUD from "./hud/HUD";
import TreeLabels from "./TreeLabels";
import RefundConfirmDialog from "./dialogs/RefundConfirmDialog";
import SkillCapDialog from "./dialogs/SkillCapDialog";

const REFUND_CONFIRM_THRESHOLD = 2;

type SkillTreeProps = {
  dbAvailable?: boolean;
  focusNodeId?: string;
};

const SkillTree = ({ dbAvailable = false, focusNodeId }: SkillTreeProps) => {
  const { t } = useTranslation("nodes");
  const focusNodeName = focusNodeId
    ? t(`${Nodes.nodes[focusNodeId]?.type}.name`)
    : undefined;
  const [selectableSkills, setSelectableSkills] = useState<string[]>([]);
  const [pendingRefund, setPendingRefund] = useState<string[] | null>(null);
  const [showCapWarning, setShowCapWarning] = useState(false);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
  const selectedSkills = useAppSelector((state) => state.skill.selectedSkills);
  const selectedSkillIds = useMemo(
    () => Object.keys(selectedSkills),
    [selectedSkills]
  );
  const connectedPaths = useAppSelector((state) => state.skill.connectedPaths);
  const unlockedBiomes = useAppSelector((state) => state.skill.unlockedBiomes);
  const playerLevel = useAppSelector((state) => state.skill.playerLevel ?? 45);
  const maxSkillPoints = computeMaxSkillPoints(playerLevel, unlockedBiomes);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!focusNodeId || !transformRef.current) return;
    const el = document.getElementById(`node-${focusNodeId}`);
    if (el) transformRef.current.zoomToElement(el, 5, 0);
  }, [focusNodeId]);

  const getPointsUsed = () =>
    Object.entries(selectedSkills).reduce(
      (acc, [id, level]) =>
        acc + (Nodes.types[Nodes.nodes[id]?.type]?.cost ?? 0) * level,
      0
    );

  const updateSelectableSkills = () => {
    let tmpSelectableSkills: string[] = [];
    // Base nodes are always selectable
    Object.values(Nodes.nodes).forEach((node) => {
      if (node.base && selectedSkills[node.id] == null) {
        tmpSelectableSkills.push(node.id);
      }
    });
    // Neighbors of selected nodes are selectable
    selectedSkillIds.forEach((id) => {
      tmpSelectableSkills = tmpSelectableSkills.concat(
        Nodes.edges[id].filter(
          (connected) => selectedSkills[connected] == null
        )
      );
    });
    setSelectableSkills(Array.from(new Set(tmpSelectableSkills)));
  };

  const executeRefund = (skillsToRemove: string[]) => {
    dispatch(removeSelectedSkill(skillsToRemove));
    dispatch(removePathsConnectedTo(skillsToRemove));
  };

  const cascadeRefund = (nodeId: string) => {
    const skillsToRemove = getSkillsToRemove(nodeId, selectedSkillIds);
    if (skillsToRemove.length >= REFUND_CONFIRM_THRESHOLD) {
      setPendingRefund(skillsToRemove);
    } else {
      playSound("node-refund", 0.4);
      executeRefund(skillsToRemove);
    }
  };

  const onSelect = (node: Node, action: SkillAction = "primary") => {
    const currentLevel = selectedSkills[node.id] ?? 0;
    const max = getMaxLevel(node.type);
    const connectedTo = selectedSkillIds.filter((id) =>
      Nodes.edges[id].includes(node.id)
    );

    if (action === "secondary") {
      if (currentLevel === 0) return;
      if (currentLevel > 1) {
        playSound("node-refund", 0.4);
        dispatch(decrementSelectedSkill(node.id));
        return;
      }
      // currentLevel === 1: removing the last level disconnects neighbors
      cascadeRefund(node.id);
      return;
    }

    // primary
    if (currentLevel === 0) {
      // Only the 0 → 1 transition cares about reachability
      if (!node.base && connectedTo.length === 0) {
        playSound("node-out-of-range", 0.4);
        window.dispatchEvent(
          new CustomEvent("skill-out-of-range", { detail: node.id })
        );
        return;
      }
      const nodeCost = Nodes.types[node.type]?.cost ?? 0;
      if (isHardcapEnabled() && getPointsUsed() + nodeCost > maxSkillPoints) {
        playSound("node-refund", 0.4);
        setShowCapWarning(true);
        return;
      }
      if (selectableSkills.includes(node.id) || node.base) {
        playSound("node-unlock", 0.4);
      } else {
        playSound("node-select", 0.4);
      }
      dispatch(incrementSelectedSkill(node.id));
      dispatch(addConnectedPaths(connectedTo.map((to) => [node.id, to])));
      return;
    }

    if (currentLevel < max) {
      const nodeCost = Nodes.types[node.type]?.cost ?? 0;
      if (isHardcapEnabled() && getPointsUsed() + nodeCost > maxSkillPoints) {
        playSound("node-refund", 0.4);
        setShowCapWarning(true);
        return;
      }
      playSound("node-unlock", 0.4);
      dispatch(incrementSelectedSkill(node.id));
      return;
    }

    // currentLevel === max: wrap to 0 = full cascade refund
    cascadeRefund(node.id);
  };

  useEffect(() => {
    updateSelectableSkills();
    if (selectedSkillIds.length === 0) {
      dispatch(loadConnectedPaths([]));
    }
  }, [selectedSkills]);

  useEffect(() => {
    const handleResize = () => {
      if (transformRef.current) {
        transformRef.current.centerView(2, 0);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      <SkillCapDialog
        open={showCapWarning}
        onClose={() => setShowCapWarning(false)}
      />
      <RefundConfirmDialog
        open={pendingRefund !== null}
        count={pendingRefund ? pendingRefund.length - 1 : 0}
        onConfirm={() => {
          if (pendingRefund) {
            playSound("node-refund", 0.4);
            executeRefund(pendingRefund);
          }
          setPendingRefund(null);
        }}
        onCancel={() => setPendingRefund(null)}
      />
      <TransformWrapper
        minScale={2}
        maxScale={5}
        wheel={{ step: 2 }}
        doubleClick={{
          disabled: true,
        }}
        onInit={(ref) => {
          transformRef.current = ref;
          if (!focusNodeId) {
            requestAnimationFrame(() => ref.centerView(2, 0));
          }
        }}
      >
        {({ zoomIn, zoomOut, centerView, zoomToElement }) => (
          <>
            <HUD zoomIn={zoomIn} zoomOut={zoomOut} centerView={centerView} zoomToElement={zoomToElement} dbAvailable={dbAvailable} initialSearchText={focusNodeName} />
            <TransformComponent contentClass="!flex !flex-wrap !w-fit !h-fit !m-0 !p-0 !origin-[0%_0%]">
              <div
                className="relative w-screen h-[100dvh] flex items-center justify-center"
              >
                <div className="relative scale-25 z-20">
                  <CoreCircle />
                  {Object.values(Nodes.nodes).map((skillNode) => (
                    <SkillNode
                      key={skillNode.id}
                      node={skillNode}
                      selected={selectedSkills[skillNode.id] != null}
                      selectable={selectableSkills.includes(skillNode.id)}
                      level={selectedSkills[skillNode.id] ?? 0}
                      maxLevel={getMaxLevel(skillNode.type)}
                      onSelect={onSelect}
                    />
                  ))}
                  <TreeLabels />
                </div>
                <svg
                  id="svg-container"
                  className="absolute inset-0 w-screen h-[100dvh]"
                >
                  <SkillPaths lines={connectedPaths} />
                </svg>
              </div>
            </TransformComponent>
            {Object.values(Nodes.nodes).map((skillNode) => (
              <SkillTooltip
                key={`tooltip-${skillNode.id}`}
                node={skillNode}
                selected={selectedSkills[skillNode.id] != null}
                selectable={selectableSkills.includes(skillNode.id)}
                level={selectedSkills[skillNode.id] ?? 0}
                maxLevel={getMaxLevel(skillNode.type)}
                onSelect={(action) => onSelect(skillNode, action)}
              />
            ))}
          </>
        )}
      </TransformWrapper>
    </>
  );
};

export default SkillTree;
