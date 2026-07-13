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
import { setSearchSkillResults } from "@/redux/skills/skills.slice";
import SkillNodes from "@/constants/Nodes";
import { buildSearchCorpus } from "@/utils/searchCorpus";
import {
  MatchRange,
  buildSnippet,
  normalizeQuery,
  scoreMatch,
} from "@/utils/searchText";

const MAX_VISIBLE_RESULTS = 5;

const HIGHLIGHT_CLASSES =
  "text-[#f0e0b0] font-semibold bg-[#b8941f]/25 rounded-[1px]";

const renderHighlighted = (text: string, range?: MatchRange) => {
  if (!range || range.start >= range.end) return text;
  return (
    <>
      {text.slice(0, range.start)}
      <span className={HIGHLIGHT_CLASSES}>
        {text.slice(range.start, range.end)}
      </span>
      {text.slice(range.end)}
    </>
  );
};

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

  const locale = router.locale ?? "en";
  const corpus = useMemo(() => buildSearchCorpus(t, locale), [t, locale]);

  const results = useMemo(() => {
    if (!searchText || searchText.length < 3) return [];

    if (exactMatch) {
      const lSearchText = searchText.toLowerCase();
      return corpus
        .filter((entry) => entry.name.toLowerCase() === lSearchText)
        .map((entry) => ({
          ...entry,
          nameMatch: { start: 0, end: entry.name.length },
          snippet: buildSnippet(entry.description),
        }));
    }

    const queryNorm = normalizeQuery(searchText, locale);
    if (!queryNorm) return [];

    return corpus
      .map((entry) => ({
        entry,
        score: scoreMatch(entry.nameNorm, entry.descNorm, queryNorm),
      }))
      .filter(({ score }) => score.weight > 0)
      .sort(
        (a, b) =>
          b.score.weight - a.score.weight ||
          a.score.position - b.score.position ||
          a.entry.name.localeCompare(b.entry.name, locale),
      )
      .map(({ entry, score }) => ({
        ...entry,
        nameMatch: score.nameMatch,
        snippet: buildSnippet(entry.description, score.descMatch),
      }));
  }, [searchText, corpus, exactMatch, locale]);

  // The dropdown shows only the top matches (no scrollbar — wheel events over
  // the HUD zoom the tree); every match still highlights on the tree via Redux.
  const visibleResults = useMemo(
    () => results.slice(0, MAX_VISIBLE_RESULTS),
    [results],
  );
  const hiddenMatchCount = results.length - visibleResults.length;

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
    (typeKey: string, name: string) => {
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
    [zoomToElement],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!visibleResults.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, visibleResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (visibleResults[selectedIndex]) {
        handleResultClick(
          visibleResults[selectedIndex].key,
          visibleResults[selectedIndex].name,
        );
      }
    }
  };

  const showResults = focused && searchText && visibleResults.length > 0;

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
            "rounded-sm",
            "shadow-[0_3px_6px_rgba(0,0,0,0.4)]",
          )}
        >
          {visibleResults.map(({ key, meta, tier, name, nameMatch, snippet }, index) => {
            const iconSize =
              tier === "large" ? 22 : tier === "medium" ? 18 : 14;
            return (
              <button
                key={key}
                onClick={() => handleResultClick(key, name)}
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
                <span className="flex flex-col min-w-0 flex-1">
                  <span
                    className={classNames(
                      "text-[#e8d5a3] truncate",
                      meta.hasIcon && "font-semibold",
                    )}
                  >
                    {renderHighlighted(name, nameMatch)}
                  </span>
                  {snippet.before + snippet.match + snippet.after !== "" && (
                    <span className="block text-xs text-[#c0b89a]/70 truncate leading-snug">
                      {snippet.leadingEllipsis && "…"}
                      {snippet.before}
                      {snippet.match && (
                        <span className={HIGHLIGHT_CLASSES}>
                          {snippet.match}
                        </span>
                      )}
                      {snippet.after}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
          {hiddenMatchCount > 0 && (
            <div
              className={classNames(
                "px-3 py-1.5 text-xs text-[#c0b89a]/60 italic",
                "border-t border-[#5a5a60]/20",
              )}
            >
              {t("hud.search.moreMatches", {
                ns: "common",
                count: hiddenMatchCount,
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
