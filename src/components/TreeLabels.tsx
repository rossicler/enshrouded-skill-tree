import React from "react";
import Image from "next/image";
import { useTranslation } from "next-i18next";
import { classNames } from "@/utils/utils";

type Labels = {
  nameKey: string;
  asset: string;
  width: number;
  height: number;
  angle: number;
  distance: number;
};

const labels: Labels[] = [
  {
    nameKey: "trickster",
    angle: 257,
    distance: 530,
    asset: "TRICKSTER",
    width: 399,
    height: 112,
  },
  {
    nameKey: "wizard",
    angle: 286,
    distance: 700,
    asset: "WIZARD",
    width: 319,
    height: 112,
  },
  {
    nameKey: "healer",
    angle: 316,
    distance: 610,
    asset: "HEALER",
    width: 306,
    height: 112,
  },
  {
    nameKey: "battlemage",
    angle: 347,
    distance: 540,
    asset: "BATTLEMAGE",
    width: 443,
    height: 112,
  },
  {
    nameKey: "tank",
    angle: 16,
    distance: 590,
    asset: "TANK",
    width: 224,
    height: 112,
  },
  {
    nameKey: "warrior",
    angle: 50,
    distance: 630,
    asset: "WARRIOR",
    width: 364,
    height: 112,
  },
  {
    nameKey: "barbarian",
    angle: 78,
    distance: 670,
    asset: "BARBARIAN",
    width: 418,
    height: 112,
  },
  {
    nameKey: "athlete",
    angle: 108,
    distance: 680,
    asset: "ATHLETE",
    width: 313,
    height: 112,
  },
  {
    nameKey: "survivor",
    angle: 136,
    distance: 650,
    asset: "SURVIVOR",
    width: 379,
    height: 112,
  },
  {
    nameKey: "beastmaster",
    angle: 170,
    distance: 605,
    asset: "BEASTMASTER",
    width: 490,
    height: 112,
  },
  {
    nameKey: "ranger",
    angle: 196,
    distance: 520,
    asset: "RANGER",
    width: 321,
    height: 112,
  },
  {
    nameKey: "assassin",
    angle: 227,
    distance: 630,
    asset: "ASSASSIN",
    width: 369,
    height: 112,
  },
];

const INIT_DISTANCE = 250;
const TO_SCALE_DOWN = 0.3;

const TreeLabels = () => {
  const { t } = useTranslation("common");
  return (
    <>
      <div className="absolute rounded-full border border-purple-400 border-opacity-30 bg-transparent -left-[200px] -bottom-[200px]" />
      {labels.map((label) => (
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
