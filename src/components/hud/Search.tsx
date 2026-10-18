import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { SkillSearch, useSkillSearch } from "@enshrouded/react";

import { classNames } from "@/utils/utils";
import { useAppDispatch } from "@/redux/hooks";
import { setSearchSkillResults } from "@/redux/skills/skills.slice";

type PropsType = {
  // Zooms the tree to a node and opens its tooltip.
  onFocusNode: (nodeId: string) => void;
  onFocusChange?: (focused: boolean) => void;
  initialSearchText?: string;
};

// The planner's search: @enshrouded/react's search box, centered at the top.
// The matches go to Redux, which highlights them on the tree. A ?focus= link
// searches for the skill's exact name until the search is edited.
const Search = ({ onFocusNode, onFocusChange, initialSearchText }: PropsType) => {
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState(initialSearchText ?? "");

  const exact = !!router.query.focus;
  const clearExactMatch = useCallback(() => {
    const { focus, ...rest } = routerRef.current.query;
    if (!focus) return;
    routerRef.current.replace({ query: rest }, undefined, { shallow: true });
  }, []);

  const { results, highlightedTypes } = useSkillSearch(query, router.locale ?? "en", { exact });

  useEffect(() => {
    dispatch(setSearchSkillResults(highlightedTypes));
  }, [highlightedTypes, dispatch]);

  const onQueryChange = useCallback(
    (next: string) => {
      clearExactMatch();
      setQuery(next);
    },
    [clearExactMatch]
  );

  return (
    <div
      className={classNames(
        "flex flex-col",
        "justify-center items-center",
        "absolute top-0 z-40 inset-x-0 pointer-events-none",
        "my-0 px-0 md:my-6 md:px-5"
      )}
    >
      <div className="w-full md:w-72 md:max-w-sm pointer-events-auto">
        <SkillSearch
          query={query}
          onQueryChange={onQueryChange}
          results={results}
          onFocus={clearExactMatch}
          onFocusNode={onFocusNode}
          onActiveChange={onFocusChange}
        />
      </div>
    </div>
  );
};

export default Search;
