import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setFlameLevel } from "@/redux/skills/skills.slice";
import { classNames } from "@/utils/utils";
import Image from "next/image";
import React, { useEffect, useState } from "react";

const MAX_POINTS = 8;

const FlameLevel = () => {
  const [level, setLevel] = useState(1);
  const dispatch = useAppDispatch();

  const increaseLevel = () => {
    if (level < MAX_POINTS) {
      setLevel(level + 1);
    }
  };

  const decreaseLevel = () => {
    if (level > 1) {
      setLevel(level - 1);
    }
  };

  useEffect(() => {
    dispatch(setFlameLevel(level));
  }, [level]);

  return (
    <div>
      <div className={classNames("flex text-xl gap-1.5 items-center")}>
        <Image
          src="/assets/flame.png"
          alt="Skill Point Icon"
          className="mr-1.5 pt-0.5"
          width={45}
          height={45}
        />
        <div
          className={classNames(
            "flex flex-row items-center mt-3.5 border border-purple-600 text-base",
            "rounded-xl divide-x divide-purple-600 bg-black [&>*]:py-1"
          )}
        >
          <button className="px-2" onClick={decreaseLevel}>
            {"-"}
          </button>
          <span className="px-3">{level}</span>
          <button className="px-2" onClick={increaseLevel}>
            {"+"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlameLevel;
