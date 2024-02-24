import SkillNodes from "@/constants/Nodes";
import { useAppSelector } from "@/redux/hooks";
import { classNames } from "@/utils/utils";
import Image from "next/image";
import React, { useEffect, useState } from "react";

const MAX_POINTS = 114;

const PointsHUD = () => {
  const [pointsUsed, setPointsUsed] = useState(0);
  const selectedSkills = useAppSelector((state) => state.skill.selectedSkills);

  useEffect(() => {
    const totalCost = selectedSkills.reduce(
      (acc, id) =>
        acc + SkillNodes.types[SkillNodes.nodes[id]?.type]?.cost ?? 0,
      0
    );
    setPointsUsed(totalCost);
  }, [selectedSkills]);

  return (
    <div
      className={classNames(
        "absolute left-0 top-0 bg-transparent z-40",
        "flex py-6 px-6 text-xl gap-1.5 items-center"
      )}
    >
      <Image
        src="/assets/skill_point_2.png"
        alt="Skill Point Icon"
        className="mr-1.5 pt-0.5"
        width={35}
        height={35}
      />
      <span className={classNames(pointsUsed > MAX_POINTS && "text-red-600")}>
        {pointsUsed}
      </span>
      <span>/ {MAX_POINTS}</span>
    </div>
  );
};

export default PointsHUD;
