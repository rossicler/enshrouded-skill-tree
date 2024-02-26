import { BasicStats, StatsType } from "@/constants/Stats";
import { useAppSelector } from "@/redux/hooks";
import { getStatsFromSkills } from "@/utils/stats";
import { classNames } from "@/utils/utils";
import React, { useMemo } from "react";

const Stats = () => {
  const skillsSelected = useAppSelector((state) => state.skill.selectedSkills);
  const stats = useMemo(
    () => getStatsFromSkills(skillsSelected),
    [skillsSelected]
  );

  return (
    <div className={classNames("flex flex-col gap-1.5 ")}>
      <h3 className="font-bold text-xl">Stats</h3>
      <div className="text-sm">
        {Object.keys(BasicStats).map((stat) => (
          <p>
            +{stats[stat as StatsType] ?? 20}{" "}
            {BasicStats[stat as StatsType].name}
          </p>
        ))}
      </div>
    </div>
  );
};

export default Stats;
