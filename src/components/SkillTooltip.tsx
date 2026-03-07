import { Tooltip } from "react-tooltip";
import { useTranslation } from "next-i18next";

import SkillNodes, { Node } from "../constants/Nodes";
import Image from "next/image";
import { classNames } from "@/utils/utils";

type PropsType = {
  node: Node;
  onShow?: () => void;
  onHide?: () => void;
};

const BG_COLOR: { [key: string]: string } = {
  red: "!bg-ig-red",
  green: "!bg-ig-green",
  blue: "!bg-ig-blue",
  gold: "!bg-ig-gold",
};

const SkillTooltip = ({ node, onShow, onHide }: PropsType) => {
  const metadata = SkillNodes.types[node.type];
  const { t } = useTranslation(["nodes", "common"]);
  const name = t(`${node.type}.name`, { ns: "nodes" });
  const description = t(`${node.type}.description`, {
    ns: "nodes",
    returnObjects: true,
  }) as string[];

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
        {name}
      </span>
      {metadata && (
        <div className="flex flex-col gap-2 mt-2">
          {description.map((html, i) => (
            <div
              key={`${node.id}-p${i}`}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ))}
          <div className="w-full flex justify-end items-center gap-2 mt-2">
            <Image
              src="/assets/skill_point.png"
              alt={t("accessibility.skillPointIcon", { ns: "common" })}
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
