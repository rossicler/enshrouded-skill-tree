import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "next-i18next";
import Image from "next/image";
import { Search as SearchIcon, X } from "lucide-react";
import { useRouter } from "next/router";

import { classNames } from "@/utils/utils";
import { useAppDispatch } from "@/redux/hooks";

import GameInput from "../shared/GameInput";
import SkillNodes from "@/constants/Nodes";
import { setSearchSkillResults } from "@/redux/skills/skills.slice";

type PropsType = {
  zoomToElement: (
    node: HTMLElement | string,
    scale?: number,
    animationTime?: number,
    animationType?:
      | "easeOut"
      | "linear"
      | "easeInQuad"
      | "easeOutQuad"
      | "easeInOutQuad"
      | "easeInCubic"
      | "easeOutCubic"
      | "easeInOutCubic"
      | "easeInQuart"
      | "easeOutQuart"
      | "easeInOutQuart"
      | "easeInQuint"
      | "easeOutQuint"
      | "easeInOutQuint",
  ) => void;
  onFocusChange?: (focused: boolean) => void;
  initialSearchText?: string;
};

const Search = ({
  zoomToElement,
  onFocusChange,
  initialSearchText,
}: PropsType) => {
  const router = useRouter();
  const [searchText, setSearchText] = useState(initialSearchText ?? "");
  const [focused, setFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);
  const { t } = useTranslation(["common", "nodes"]);
  const dispatch = useAppDispatch();

  const exactMatch = !!router.query.focus;

  const clearExactMatch = useCallback(() => {
    const { focus, ...rest } = routerRef.current.query;
    if (!focus) return;
    routerRef.current.replace({ query: rest }, undefined, { shallow: true });
  }, []);

  const results = useMemo(() => {
    if (!searchText || searchText.length < 3) return [];
    const lSearchText = searchText.toLowerCase();
    return Object.entries(SkillNodes.types)
      .filter(([key]) => {
        const name = t(`${key}.name`, { ns: "nodes" });
        return exactMatch
          ? name.toLowerCase() === lSearchText
          : name.toLowerCase().includes(lSearchText);
      })
      .map(([key, meta]) => {
        const node = Object.values(SkillNodes.nodes).find(
          (n) => n.type === key,
        );
        return { key, meta, tier: node?.tier ?? "small" };
      });
  }, [searchText, t]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  useEffect(() => {
    dispatch(setSearchSkillResults(results.map((r) => r.key)));
  }, [results, dispatch]);

  const hasActiveResults =
    focused && searchText.length >= 3 && results.length > 0;

  useEffect(() => {
    onFocusChange?.(hasActiveResults);
  }, [hasActiveResults, onFocusChange]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as globalThis.Node)
      ) {
        setFocused(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = useCallback(
    (typeKey: string) => {
      const name = t(`${typeKey}.name`, { ns: "nodes" });
      setSearchText(name);
      clearExactMatch();
      setFocused(false);
      inputRef.current?.blur();
      const matchingNodes = Object.values(SkillNodes.nodes).filter(
        (n) => n.type === typeKey,
      );
      if (matchingNodes.length === 1) {
        const nodeId = matchingNodes[0].id;
        zoomToElement(`node-${nodeId}`, 5, 300, "easeOut");
        // Trigger tooltip via synthetic mouseenter after zoom completes
        setTimeout(() => {
          const el = document.querySelector(
            `[data-tooltip-id="skill-tooltip-${nodeId}"]`,
          );
          if (el) {
            el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
          }
        }, 350);
      }
    },
    [t, zoomToElement],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleResultClick(results[selectedIndex].key);
      }
    }
  };

  const showResults = focused && searchText && results.length > 0;

  return (
    <div
      ref={containerRef}
      className={classNames(
        "flex flex-col",
        "justify-center items-center",
        "absolute top-0 z-40 inset-x-0 pointer-events-none",
        "my-0 px-0 md:my-6 md:px-5",
      )}
    >
      <div className="relative w-full md:w-72 md:max-w-sm pointer-events-auto">
        <GameInput
          ref={inputRef}
          placeholder={t("hud.search.placeholder", { ns: "common" })}
          value={searchText}
          onChange={(e) => {
            clearExactMatch();
            setSearchText(e.target.value);
          }}
          onFocus={() => {
            clearExactMatch();
            setFocused(true);
          }}
          onKeyDown={handleKeyDown}
          hideDecorationsClassName="hidden md:block"
        />
        {searchText ? (
          <button
            onClick={() => {
              clearExactMatch();
              setSearchText("");
            }}
            className={classNames(
              "absolute inset-y-0 right-8 text-[#e8d5a3]/60 hover:text-[#e8d5a3] h-full z-20",
              "flex items-center justify-center transition-colors",
            )}
          >
            <X size={18} />
          </button>
        ) : (
          <div
            className={classNames(
              "absolute inset-y-0 right-8 text-[#e8d5a3]/60 h-full z-20",
              "flex items-center justify-center pointer-events-none",
            )}
          >
            <SearchIcon size={20} />
          </div>
        )}
      </div>

      {showResults && (
        <div
          className={classNames(
            "mt-0 md:mt-1",
            "w-full md:w-72 md:max-w-sm",
            "bg-[#414255]/95 border border-[#5a5a60]/50 border-t-[#b8941f]/60",
            "rounded-sm overflow-y-auto max-h-60",
            "shadow-[0_3px_6px_rgba(0,0,0,0.4)]",
          )}
        >
          {results.map(({ key, meta, tier }, index) => {
            const iconSize =
              tier === "large" ? 22 : tier === "medium" ? 18 : 14;
            return (
              <button
                key={key}
                onClick={() => handleResultClick(key)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={classNames(
                  "flex items-center gap-2.5 px-3 py-2 w-full text-left",
                  "border-b border-[#5a5a60]/20 last:border-b-0",
                  "text-sm text-[#c0b89a]",
                  "hover:bg-white/[0.06] transition-colors",
                  index === selectedIndex && "bg-white/[0.08]",
                )}
              >
                <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                  {meta.hasIcon ? (
                    <Image
                      src={`/assets/skills/${meta.selectedAsset ?? key}.png`}
                      alt=""
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  ) : (
                    <Image
                      src={`/assets/${meta.color}_${tier}.png`}
                      alt=""
                      width={iconSize}
                      height={iconSize}
                      className="object-contain"
                    />
                  )}
                </div>
                <span
                  className={classNames(
                    "text-[#e8d5a3] truncate",
                    meta.hasIcon && "font-semibold",
                  )}
                >
                  {t(`${key}.name`, { ns: "nodes" })}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Search;
