import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { SEARCH_MIN_QUERY_LENGTH, getNodesOfType, type MatchRange, type SkillSearchResult } from "@enshrouded/core";

import { useUiText } from "./text";
import { GameInput } from "./kit/GameInput";
import { classNames, useAssetUrl } from "./kit/shared";

const DEFAULT_MAX_RESULTS = 5;

const HIGHLIGHT_CLASSES = "text-[#f0e0b0] font-semibold bg-[#b8941f]/25 rounded-[1px]";

const renderHighlighted = (text: string, range?: MatchRange) => {
  if (!range || range.start >= range.end) return text;
  return (
    <>
      {text.slice(0, range.start)}
      <span className={HIGHLIGHT_CLASSES}>{text.slice(range.start, range.end)}</span>
      {text.slice(range.end)}
    </>
  );
};

export type SkillSearchProps = {
  query: string;
  onQueryChange: (query: string) => void;
  // From useSkillSearch(query, locale).results.
  results: SkillSearchResult[];
  // A result was picked (click or Enter). The query is already set to its name.
  onSelect?: (result: SkillSearchResult) => void;
  // A picked result's skill type has a single node: zoom the tree to it, e.g.
  // with SkillTreeView's focusNode(id, { showTooltip: true }).
  onFocusNode?: (nodeId: string) => void;
  // True while the results list is open.
  onActiveChange?: (active: boolean) => void;
  // The input got focus.
  onFocus?: () => void;
  // How many results the list shows. The rest are counted below it (they are
  // still highlighted on the tree). Default 5.
  maxResults?: number;
  // "responsive": a flat field below the md breakpoint and the decorated one
  // from md up (the planner's look). "decorated": always the decorated field.
  look?: "responsive" | "decorated";
  className?: string;
};

// The skill search box: a game-styled field with a results list. It fills
// its container's width; the list opens below the field, in the flow.
export const SkillSearch = ({
  query,
  onQueryChange,
  results,
  onSelect,
  onFocusNode,
  onActiveChange,
  onFocus,
  maxResults = DEFAULT_MAX_RESULTS,
  look = "responsive",
  className,
}: SkillSearchProps) => {
  const t = useUiText();
  const asset = useAssetUrl();
  const [focused, setFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // The list shows only the top matches (no scrollbar: wheel events over a
  // planner's HUD zoom the tree); every match is still highlighted.
  const visibleResults = useMemo(() => results.slice(0, maxResults), [results, maxResults]);
  const hiddenMatchCount = results.length - visibleResults.length;

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const active = focused && query.length >= SEARCH_MIN_QUERY_LENGTH && results.length > 0;
  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);

  // A press outside the box closes the list.
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as globalThis.Node)) {
        setFocused(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const pick = useCallback(
    (result: SkillSearchResult) => {
      onQueryChange(result.name);
      setFocused(false);
      inputRef.current?.blur();
      onSelect?.(result);
      const nodes = getNodesOfType(result.key);
      if (nodes.length === 1) onFocusNode?.(nodes[0]);
    },
    [onQueryChange, onSelect, onFocusNode]
  );

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!visibleResults.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, visibleResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const result = visibleResults[selectedIndex];
      if (result) pick(result);
    }
  };

  const showResults = focused && query && visibleResults.length > 0;
  const responsive = look === "responsive";

  return (
    <div ref={containerRef} className={classNames("flex flex-col w-full", className)} data-skill-search>
      <div className="relative w-full">
        <GameInput
          ref={inputRef}
          data-hud="search-input"
          role="combobox"
          aria-expanded={!!showResults}
          aria-autocomplete="list"
          placeholder={t("search.placeholder")}
          aria-label={t("search.placeholder")}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => {
            onFocus?.();
            setFocused(true);
          }}
          onKeyDown={handleKeyDown}
          hideDecorationsClassName={responsive ? "hidden md:block" : undefined}
        />
        {query ? (
          <button
            type="button"
            aria-label={t("search.clear")}
            onClick={() => onQueryChange("")}
            className={classNames(
              "absolute inset-y-0 right-8 text-[#e8d5a3]/60 hover:text-[#e8d5a3] h-full z-20",
              "flex items-center justify-center transition-colors"
            )}
          >
            <X size={18} />
          </button>
        ) : (
          <div
            className={classNames(
              "absolute inset-y-0 right-8 text-[#e8d5a3]/60 h-full z-20",
              "flex items-center justify-center pointer-events-none"
            )}
          >
            <SearchIcon size={20} />
          </div>
        )}
      </div>

      {showResults && (
        <div
          role="listbox"
          className={classNames(
            "w-full",
            responsive ? "mt-0 md:mt-1" : "mt-1",
            "bg-[#414255]/95 border border-[#5a5a60]/50 border-t-[#b8941f]/60",
            "rounded-xs",
            "shadow-[0_3px_6px_rgba(0,0,0,0.4)]"
          )}
        >
          {visibleResults.map((result, index) => {
            const { key, meta, tier, name, nameMatch, snippet } = result;
            const iconSize = tier === "large" ? 22 : tier === "medium" ? 18 : 14;
            return (
              <button
                type="button"
                role="option"
                aria-selected={index === selectedIndex}
                key={key}
                data-search-result={key}
                onClick={() => pick(result)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={classNames(
                  "flex items-center gap-2.5 px-3 py-2 w-full text-left",
                  "border-b border-[#5a5a60]/20 last:border-b-0",
                  "text-sm text-[#c0b89a]",
                  "hover:bg-white/[0.06] transition-colors",
                  index === selectedIndex && "bg-white/[0.08]"
                )}
              >
                <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                  {meta.hasIcon ? (
                    <img
                      src={asset(`skills/${meta.selectedAsset ?? key}.png`)}
                      alt=""
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  ) : (
                    <img
                      src={asset(`nodes/${meta.color}_${tier}.png`)}
                      alt=""
                      width={iconSize}
                      height={iconSize}
                      className="object-contain"
                    />
                  )}
                </div>
                <span className="flex flex-col min-w-0 flex-1">
                  <span className={classNames("text-[#e8d5a3] truncate", meta.hasIcon && "font-semibold")}>
                    {renderHighlighted(name, nameMatch)}
                  </span>
                  {snippet.before + snippet.match + snippet.after !== "" && (
                    <span className="block text-xs text-[#c0b89a]/70 truncate leading-snug">
                      {snippet.leadingEllipsis && "…"}
                      {snippet.before}
                      {snippet.match && <span className={HIGHLIGHT_CLASSES}>{snippet.match}</span>}
                      {snippet.after}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
          {hiddenMatchCount > 0 && (
            <div className={classNames("px-3 py-1.5 text-xs text-[#c0b89a]/60 italic", "border-t border-[#5a5a60]/20")}>
              {t("search.moreMatches", { count: hiddenMatchCount })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
