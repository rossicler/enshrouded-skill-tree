import React, { useEffect, useState } from "react";

import { classNames } from "@/utils/utils";
import { useAppDispatch } from "@/redux/hooks";

import SearchIcon from "../icons/Search";
import SkillNodes from "@/constants/Nodes";
import { setSearchSkillResults } from "@/redux/skills/skills.slice";

const Search = () => {
  const [searchText, setSearchText] = useState("");
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (searchText) {
      const lSearchText = searchText.toLowerCase();
      const results = Object.entries(SkillNodes.types)
        .filter(
          ([_, skill]) =>
            skill.name.toLowerCase().includes(lSearchText) ||
            skill.description.some((desc) =>
              desc.toLowerCase().includes(lSearchText)
            )
        )
        .map(([key]) => key);
      dispatch(setSearchSkillResults(results));
    } else {
      dispatch(setSearchSkillResults([]));
    }
  }, [searchText]);

  return (
    <div
      className={classNames(
        "absolute top-0 left-[50%] translate-x-[-50%] bg-transparent z-20 flex flex-col gap-3",
        "justify-center items-center my-6 bg-transparent "
      )}
    >
      <div className="w-72 p-0.5 bg-purple-600 rounded-lg relative">
        <input
          className={classNames(
            "shadow appearance-none  rounded-md w-full",
            "py-1.5 px-3 text-white leading-tight focus:outline-none",
            "focus:shadow-outline bg-gray-900"
          )}
          placeholder="Search"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <div
          className={classNames(
            "absolute inset-y-0 right-3 text-white h-full",
            "flex items-center justify-center"
          )}
        >
          <SearchIcon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default Search;
