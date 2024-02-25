import { Tooltip } from "react-tooltip";

import SkillNodes, { Node } from "../constants/Nodes";
import Image from "next/image";
import { classNames } from "@/utils/utils";

type PropsType = {
  node: Node;
  onShow?: () => void;
  onHide?: () => void;
};

const BG_COLOR: { [key: string]: string } = {
  red: "!bg-red",
  green: "!bg-green",
  blue: "!bg-blue",
  gold: "!bg-gold",
};

const SkillTooltip = ({ node, onShow, onHide }: PropsType) => {
  const metadata = SkillNodes.types[node.type];
  return (
    <Tooltip
      id={`skill-tooltip-${node.id}`}
      className={classNames(
        "z-50 p-2 max-w-sm !bg-opacity-60 border-2 border-white !rounded-lg",
        BG_COLOR[metadata.color] ?? "!bg-purple-600"
      )}
      afterShow={onShow}
      afterHide={onHide}
    >
      <span className="uppercase text-xl text-white font-bold">
        {metadata ? metadata.name : node.type}
      </span>
      {metadata && (
        <div className="flex flex-col gap-2 mt-2">
          {metadata.description.map((html, i) => (
            <div
              key={`${node.id}-p${i}`}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ))}
          <div className="w-full flex justify-end items-center gap-2 mt-2">
            <Image
              src="/assets/skill_point.png"
              alt="Skill Point Icon"
              width={25}
              height={25}
            />
            <strong className="text-xl">{metadata.cost}</strong>
          </div>
        </div>
      )}
    </Tooltip>
  );
};

export default SkillTooltip;
