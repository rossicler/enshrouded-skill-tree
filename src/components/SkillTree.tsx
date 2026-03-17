import { useEffect, useRef, useState } from "react";
import { TransformComponent, TransformWrapper, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  addConnectedPaths,
  addSelectedSkill,
  loadConnectedPaths,
  removePathsConnectedTo,
  removeSelectedSkill,
} from "@/redux/skills/skills.slice";
import Nodes, { Node } from "../constants/Nodes";
import CoreCircle from "./CoreCircle";
import SkillNode from "./SkillNode";
import SkillTooltip from "./SkillTooltip";
import SkillPaths from "./SkillPaths";
import { getSkillsToRemove } from "../utils/utils";
import { playSound } from "../utils/sounds";
import HUD from "./hud/HUD";
import TreeLabels from "./TreeLabels";
import RefundConfirmDialog from "./dialogs/RefundConfirmDialog";
import SkillCapDialog from "./dialogs/SkillCapDialog";

const REFUND_CONFIRM_THRESHOLD = 2;
const MAX_SKILL_POINTS = 184;

const SkillTree = () => {
  const [selectableSkills, setSelectableSkills] = useState<string[]>([]);
  const [pendingRefund, setPendingRefund] = useState<string[] | null>(null);
  const [showCapWarning, setShowCapWarning] = useState(false);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
  const selectedSkills = useAppSelector((state) => state.skill.selectedSkills);
  const connectedPaths = useAppSelector((state) => state.skill.connectedPaths);
  const dispatch = useAppDispatch();

  const getPointsUsed = () =>
    selectedSkills.reduce(
      (acc, id) => acc + (Nodes.types[Nodes.nodes[id]?.type]?.cost ?? 0),
      0
    );

  const updateSelectableSkills = () => {
    let tmpSelectableSkills: string[] = [];
    // Base nodes are always selectable
    Object.values(Nodes.nodes).forEach((node) => {
      if (node.base && !selectedSkills.includes(node.id)) {
        tmpSelectableSkills.push(node.id);
      }
    });
    // Neighbors of selected nodes are selectable
    selectedSkills.forEach((id) => {
      tmpSelectableSkills = tmpSelectableSkills.concat(
        Nodes.edges[id].filter(
          (connected) => !selectedSkills.includes(connected)
        )
      );
    });
    setSelectableSkills(Array.from(new Set(tmpSelectableSkills)));
  };

  const executeRefund = (skillsToRemove: string[]) => {
    dispatch(removeSelectedSkill(skillsToRemove));
    dispatch(removePathsConnectedTo(skillsToRemove));
  };

  const onSelect = (node: Node) => {
    const connectedTo = selectedSkills.filter((id) =>
      Nodes.edges[id].includes(node.id)
    );
    if (!node.base && connectedTo.length === 0) {
      playSound("node-out-of-range", 0.4);
      window.dispatchEvent(new CustomEvent("skill-out-of-range", { detail: node.id }));
      return;
    }
    const selectedIndex = selectedSkills.findIndex((id) => id === node.id);
    if (selectedIndex !== -1) {
      const skillsToRemove = getSkillsToRemove(node.id, selectedSkills);
      if (skillsToRemove.length >= REFUND_CONFIRM_THRESHOLD) {
        setPendingRefund(skillsToRemove);
      } else {
        playSound("node-refund", 0.4);
        executeRefund(skillsToRemove);
      }
    } else {
      const nodeCost = Nodes.types[node.type]?.cost ?? 0;
      if (getPointsUsed() + nodeCost > MAX_SKILL_POINTS) {
        playSound("node-refund", 0.4);
        setShowCapWarning(true);
        return;
      }
      if (selectableSkills.includes(node.id) || node.base) {
        playSound("node-unlock", 0.4);
      } else {
        playSound("node-select", 0.4);
      }
      dispatch(addSelectedSkill(node.id));
      dispatch(addConnectedPaths(connectedTo.map((to) => [node.id, to])));
    }
  };

  useEffect(() => {
    updateSelectableSkills();
    if (selectedSkills.length === 0) {
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
          setTimeout(() => {
            ref.centerView(2, 0);
          }, 0);
        }}
      >
        {({ zoomIn, zoomOut, centerView, zoomToElement }) => (
          <>
            <HUD zoomIn={zoomIn} zoomOut={zoomOut} centerView={centerView} zoomToElement={zoomToElement} />
            <TransformComponent contentClass="!flex !flex-wrap !w-fit !h-fit !m-0 !p-0 !origin-[0%_0%]">
              <div
                className="relative w-screen h-screen flex items-center justify-center"
              >
                <div className="relative scale-25 z-20">
                  <CoreCircle />
                  {Object.values(Nodes.nodes).map((skillNode) => (
                    <SkillNode
                      key={skillNode.id}
                      node={skillNode}
                      selected={selectedSkills.includes(skillNode.id)}
                      selectable={selectableSkills.includes(skillNode.id)}
                      onSelect={onSelect}
                    />
                  ))}
                  <TreeLabels />
                </div>
                <svg
                  id="svg-container"
                  className="absolute inset-0 w-screen h-screen"
                >
                  <SkillPaths lines={connectedPaths} />
                </svg>
              </div>
            </TransformComponent>
            {Object.values(Nodes.nodes).map((skillNode) => (
              <SkillTooltip
                key={`tooltip-${skillNode.id}`}
                node={skillNode}
                selected={selectedSkills.includes(skillNode.id)}
                selectable={selectableSkills.includes(skillNode.id)}
              />
            ))}
          </>
        )}
      </TransformWrapper>
    </>
  );
};

export default SkillTree;
