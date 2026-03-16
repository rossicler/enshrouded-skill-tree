import SkillNodes from "@/constants/Nodes";
import { useAppSelector } from "@/redux/hooks";
import { classNames } from "@/utils/utils";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import Stats from "./Stats";
import FlameLevel from "./FlameLevel";
import GamePanel from "../shared/GamePanel";
import Tooltip from "../shared/Tooltip";

const MAX_POINTS = 184;

const PointsHUD = () => {
  const [pointsUsed, setPointsUsed] = useState(0);
  const { t } = useTranslation("common");
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
        "absolute left-0 z-40",
        "py-6 px-6 flex flex-col gap-3",
        "top-14 md:top-0"
      )}
    >
      <GamePanel>
        <div
          className={classNames(
            "px-4 py-3",
            "grid grid-cols-[45px_1fr] gap-x-2 gap-y-3 items-center"
          )}
        >
          <Tooltip text={t("hud.tooltips.skillPoints")} position="bottom" className="flex justify-center">
            <Image
              src="/assets/skill_point_2.png"
              alt={t("accessibility.skillPointIcon")}
              width={30}
              height={30}
            />
          </Tooltip>
          <div className={classNames("flex text-lg gap-1.5 items-center")}>
            <span
              className={classNames(
                "font-semibold tracking-wide",
                "text-[#e8d5a3] drop-shadow-[0_0_4px_rgba(202,152,3,0.4)]",
                pointsUsed >= MAX_POINTS && "!text-red-500"
              )}
            >
              {pointsUsed}
            </span>
            <span className="font-semibold tracking-wide text-[#e8d5a3]/60">
              / {MAX_POINTS}
            </span>
          </div>

          <Tooltip text={t("hud.tooltips.flameLevel")} position="bottom" className="flex justify-center">
            <Image
              src="/assets/flame.png"
              alt={t("accessibility.flameIcon")}
              width={45}
              height={45}
            />
          </Tooltip>
          <FlameLevel />
        </div>
      </GamePanel>
      <Stats />
    </div>
  );
};

export default PointsHUD;
