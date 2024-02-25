import { classNames } from "@/utils/utils";
import Image from "next/image";
import React from "react";

type Labels = {
  name: string;
  asset: string;
  width: number;
  height: number;
  angle: number;
  distance: number;
};

const labels: Labels[] = [
  {
    name: "Trickster",
    angle: 257,
    distance: 530,
    asset: "TRICKSTER",
    width: 399,
    height: 112,
  },
  {
    name: "Wizard",
    angle: 286,
    distance: 700,
    asset: "WIZARD",
    width: 319,
    height: 112,
  },
  {
    name: "Healer",
    angle: 316,
    distance: 610,
    asset: "HEALER",
    width: 306,
    height: 112,
  },
  {
    name: "Battlemage",
    angle: 347,
    distance: 480,
    asset: "BATTLEMAGE",
    width: 443,
    height: 112,
  },
  {
    name: "Tank",
    angle: 16,
    distance: 590,
    asset: "TANK",
    width: 224,
    height: 112,
  },
  {
    name: "Warrior",
    angle: 50,
    distance: 630,
    asset: "WARRIOR",
    width: 364,
    height: 112,
  },
  {
    name: "Barbarian",
    angle: 78,
    distance: 670,
    asset: "BARBARIAN",
    width: 418,
    height: 112,
  },
  {
    name: "Athlete",
    angle: 106,
    distance: 480,
    asset: "ATHLETE",
    width: 313,
    height: 112,
  },
  {
    name: "Survivor",
    angle: 136,
    distance: 650,
    asset: "SURVIVOR",
    width: 379,
    height: 112,
  },
  {
    name: "Beastmaster",
    angle: 168,
    distance: 520,
    asset: "BEASTMASTER",
    width: 490,
    height: 112,
  },
  {
    name: "Ranger",
    angle: 196,
    distance: 520,
    asset: "RANGER",
    width: 321,
    height: 112,
  },
  {
    name: "Assassin",
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
  return (
    <>
      <div className="absolute rounded-full border border-purple-400 border-opacity-30 bg-transparent -left-[200px] -bottom-[200px]" />
      {labels.map((label) => (
        <div
          key={label.name}
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
                alt={label.name}
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
