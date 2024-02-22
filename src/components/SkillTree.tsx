import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import Nodes, { Node } from "../constants/Nodes";
import CoreCircle from "./CoreCircle";
import SkillNode from "./SkillNode";
import SkillPaths from "./SkillPaths";
import {
  convertHashToJson,
  convertJsonToHash,
  getSkillsToRemove,
} from "../utils/utils";
import HUD from "./HUD";

type SkillPathsType = [string, string][];

const SkillTree = () => {
  const searchParams = useSearchParams();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectableSkills, setSelectableSkills] = useState<string[]>([]);
  const [connectedPaths, setConnectedPaths] = useState<SkillPathsType>([]);
  const initHash = searchParams.get("hash");

  const importHandler = () => {};

  const exportHandler = () => {
    console.log(convertJsonToHash(selectedSkills));
  };

  const addPaths = (paths: SkillPathsType) => {
    setConnectedPaths((prev) => [...prev, ...paths]);
  };

  const removePathsConnectedTo = (ids: string[]) => {
    setConnectedPaths((prev) =>
      prev.filter((paths) => !ids.some((id) => paths.includes(id)))
    );
  };

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

  const initPathsConnected = (skills: string[]) => {
    let paths: SkillPathsType = [];
    const alreadySetObj: { [key: string]: boolean } = {};
    skills.forEach((id) => {
      const connectedTo = skills.filter((to) => Nodes.edges[id].includes(to));
      connectedTo.forEach((to) => {
        const pathId = id > to ? `${id}-${to}` : `${to}-${id}`;
        if (!alreadySetObj[pathId]) {
          paths.push([id, to]);
          alreadySetObj[pathId] = true;
        }
      });
    });
    setConnectedPaths(paths);
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
    if (initHash) {
      const initSkills = convertHashToJson(initHash);
      setSelectedSkills(initSkills);
      initPathsConnected(initSkills);
    }
  }, [initHash]);

  useEffect(() => {
    updateSelectableSkills();
  }, [selectedSkills]);

  return (
    <div className="relative w-screen h-screen flex items-center justify-center">
      <HUD onImport={importHandler} onExport={exportHandler} />
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
