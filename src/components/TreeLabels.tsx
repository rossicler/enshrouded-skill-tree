import { classNames } from "@/utils/utils";
import React from "react";

type Labels = { label: string; angle: number; distance: number };

const labels: Labels[] = [
  {
    label: "Trickster",
    angle: 257,
    distance: 530,
  },
  {
    label: "Wizard",
    angle: 286,
    distance: 700,
  },
  {
    label: "Healer",
    angle: 316,
    distance: 610,
  },
  {
    label: "Battlemage",
    angle: 347,
    distance: 480,
  },
  {
    label: "Tank",
    angle: 16,
    distance: 590,
  },
  {
    label: "Warrior",
    angle: 47,
    distance: 610,
  },
  {
    label: "Barbarian",
    angle: 78,
    distance: 670,
  },
  {
    label: "Athlete",
    angle: 106,
    distance: 480,
  },
  {
    label: "Survivor",
    angle: 136,
    distance: 650,
  },
  {
    label: "Beastmaster",
    angle: 168,
    distance: 520,
  },
  {
    label: "Ranger",
    angle: 196,
    distance: 520,
  },
  {
    label: "Assassin",
    angle: 227,
    distance: 630,
  },
];

const INIT_DISTANCE = 250;

const TreeLabels = () => {
  return (
    <>
      <div className="absolute rounded-full border border-purple-400 border-opacity-30 bg-transparent -left-[200px] -bottom-[200px]" />
      {labels.map((label) => (
        <div
          key={label.label}
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
              }}
            >
              {label.label}
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default TreeLabels;
