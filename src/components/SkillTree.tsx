import { useEffect, useState } from "react";

import Nodes, { Node } from "../constants/Nodes";
import CoreCircle from "./CoreCircle";
import SkillNode from "./SkillNode";
import SkillPaths from "./SkillPaths";
import { getSkillsToRemove } from "../utils/utils";

type SkillPathsType = [string, string][];

const SkillTree = () => {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectableSkills, setSelectableSkills] = useState<string[]>([]);
  const [connectedPaths, setConnectedPaths] = useState<SkillPathsType>([]);

  const addPaths = (paths: SkillPathsType) => {
    setConnectedPaths((prev) => [...prev, ...paths]);
  };

  const removePathsConnectedTo = (ids: string[]) => {
    setConnectedPaths((prev) =>
      prev.filter((paths) => !ids.some((id) => paths.includes(id)))
    );
  };

  const onSelect = (node: Node) => {
    const connectedTo = selectedSkills.filter((id) =>
      Nodes.edges[id].includes(node.id)
    );
    if (!node.base && connectedTo.length === 0) return;
    const selectedIndex = selectedSkills.findIndex((id) => id === node.id);
    if (selectedIndex !== -1) {
      const skillsToRemove = getSkillsToRemove(node.id, selectedSkills);
      setSelectedSkills((prev) =>
        prev.filter((id) => !skillsToRemove.includes(id))
      );
      removePathsConnectedTo(skillsToRemove);
    } else {
      setSelectedSkills((prev) => [...prev, node.id]);
      addPaths(connectedTo.map((to) => [node.id, to]));
    }
  };

  useEffect(() => {
    let tmpSelectableSkills: string[] = [];
    selectedSkills.forEach((id) => {
      tmpSelectableSkills = tmpSelectableSkills.concat(
        Nodes.edges[id].filter(
          (connected) => !selectedSkills.includes(connected)
        )
      );
    });
    setSelectableSkills(Array.from(new Set(tmpSelectableSkills)));
  }, [selectedSkills]);

  return (
    <div className="relative w-screen h-screen flex items-center justify-center">
      <div className="relative scale-50 z-20">
        <CoreCircle />
        {Nodes.nodes.map((skillNode) => (
          <SkillNode
            key={skillNode.id}
            node={skillNode}
            selected={selectedSkills.includes(skillNode.id)}
            selectable={selectableSkills.includes(skillNode.id)}
            onSelect={onSelect}
          />
        ))}
      </div>
      {/* Add default paths */}
      <svg id="svg-container" className="absolute inset-0 w-screen h-screen">
        <SkillPaths />
      </svg>
      {/* Add connected paths */}
      <svg
        id="svg-connected-container"
        className="absolute inset-0 w-screen h-screen z-10"
      >
        <SkillPaths lines={connectedPaths} color="#56422b" />
      </svg>
    </div>
  );
};

export default SkillTree;
