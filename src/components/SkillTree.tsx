import { useEffect, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

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
import SkillPaths from "./SkillPaths";
import { getSkillsToRemove } from "../utils/utils";
import HUD from "./hud/HUD";
import TreeLabels from "./TreeLabels";

const SkillTree = () => {
  const [selectableSkills, setSelectableSkills] = useState<string[]>([]);
  const selectedSkills = useAppSelector((state) => state.skill.selectedSkills);
  const connectedPaths = useAppSelector((state) => state.skill.connectedPaths);
  const dispatch = useAppDispatch();

  const updateSelectableSkills = () => {
    let tmpSelectableSkills: string[] = [];
    selectedSkills.forEach((id) => {
      tmpSelectableSkills = tmpSelectableSkills.concat(
        Nodes.edges[id].filter(
          (connected) => !selectedSkills.includes(connected)
        )
      );
    });
    setSelectableSkills(Array.from(new Set(tmpSelectableSkills)));
  };

  const onSelect = (node: Node) => {
    const connectedTo = selectedSkills.filter((id) =>
      Nodes.edges[id].includes(node.id)
    );
    if (!node.base && connectedTo.length === 0) return;
    const selectedIndex = selectedSkills.findIndex((id) => id === node.id);
    if (selectedIndex !== -1) {
      const skillsToRemove = getSkillsToRemove(node.id, selectedSkills);
      dispatch(removeSelectedSkill(skillsToRemove));
      dispatch(removePathsConnectedTo(skillsToRemove));
    } else {
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

  return (
    <TransformWrapper
      minScale={2}
      maxScale={5}
      doubleClick={{
        disabled: true,
      }}
      onInit={(ref) => {
        ref.zoomIn();
      }}
    >
      {({ zoomIn, zoomOut, centerView }) => (
        <>
          <HUD zoomIn={zoomIn} zoomOut={zoomOut} centerView={centerView} />
          <TransformComponent contentClass="!flex !flex-wrap !w-fit !h-fit !m-0 !p-0 !origin-[0%_0%]">
            <div className="relative w-screen h-screen flex items-center justify-center">
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
        </>
      )}
    </TransformWrapper>
  );
};

export default SkillTree;
