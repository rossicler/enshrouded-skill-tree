import React from "react";
import Image from "next/image";
import { useTranslation } from "next-i18next";
import { classNames } from "@/utils/utils";
import { TREE_LABELS } from "@/constants/TreeLabels";

const INIT_DISTANCE = 250;
const TO_SCALE_DOWN = 0.3;

const TreeLabels = () => {
  const { t } = useTranslation("common");
  return (
    <>
      <div className="absolute rounded-full border border-purple-400 border-opacity-30 bg-transparent -left-[200px] -bottom-[200px]" />
      {TREE_LABELS.map((label) => (
        <div
          key={label.nameKey}
          className="absolute top-0 left-0 h-full"
          style={{
            transformOrigin: "0% 0%",
            transform: `rotate(${label.angle}deg)`,
          }}
        >
          <div
            className={`relative`}
            style={{ marginTop: INIT_DISTANCE + label.distance }}
          >
            <div
              className={classNames("absolute uppercase")}
              style={{
                transformOrigin: "center",
                transform: `rotate(-${label.angle}deg)`,
                width: label.width * TO_SCALE_DOWN,
                height: label.height * TO_SCALE_DOWN,
              }}
            >
              <Image
                src={`/assets/labels/${label.asset}.png`}
                alt={t(`treeLabels.${label.nameKey}`)}
                height={label.height * TO_SCALE_DOWN}
                width={label.width * TO_SCALE_DOWN}
              />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default TreeLabels;
