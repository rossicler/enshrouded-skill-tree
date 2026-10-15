import React from "react";
import Image from "next/image";
import { useTranslation } from "next-i18next/pages";
import { classNames } from "@/utils/utils";
import { TREE_LABELS, getTreeLabelName } from "@enshrouded/core";

const INIT_DISTANCE = 250;
const TO_SCALE_DOWN = 0.3;

const TreeLabels = () => {
  const { i18n } = useTranslation("common");
  const language = i18n.resolvedLanguage ?? i18n.language;
  return (
    <>
      <div className="absolute rounded-full border border-purple-400/30 bg-transparent -left-[200px] -bottom-[200px]" />
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
                alt={getTreeLabelName(label.nameKey, language)}
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
