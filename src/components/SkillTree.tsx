import { useState } from "react";
import Nodes, { Node } from "../constants/Nodes";
import CoreCircle from "./CoreCircle";
import SkillNode from "./SkillNode";
import SkillPaths from "./SkillPaths";
import { getSkillsToRemove } from "../utils/utils";

type SkillPathsType = [string, string][];

const SkillTree = () => {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
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

  return (
    <div className="relative scale-50 z-10">
      <CoreCircle />
      {Nodes.nodes.map((skillNode) => (
        <SkillNode
          key={skillNode.id}
          node={skillNode}
          selected={selectedSkills.includes(skillNode.id)}
          onSelect={onSelect}
        />
      ))}
      {/* Add connected paths */}
      <SkillPaths lines={connectedPaths} color="#56422b" />
      {/* Add default paths */}
      <SkillPaths />
    </div>
  );
};

export default SkillTree;
