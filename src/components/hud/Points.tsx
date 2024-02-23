import SkillNodes from "@/constants/Nodes";
import { useAppSelector } from "@/redux/hooks";
import { classNames } from "@/utils/utils";
import React, { useEffect, useState } from "react";

const MAX_POINTS = 114;

const PointsHUD = () => {
  const [pointsUsed, setPointsUsed] = useState(0);
  const selectedSkills = useAppSelector((state) => state.skill.selectedSkills);

  useEffect(() => {
    const totalCost = selectedSkills.reduce(
      (acc, id) => acc + SkillNodes.types[SkillNodes.nodes[id].type].cost,
      0
    );
    setPointsUsed(totalCost);
  }, [selectedSkills]);

  return (
    <div
      className={classNames(
        "absolute left-0 top-0 bg-transparent z-40",
        "flex py-6 px-6 text-lg"
      )}
    >
      {pointsUsed} / {MAX_POINTS} Points
    </div>
  );
};

export default PointsHUD;
