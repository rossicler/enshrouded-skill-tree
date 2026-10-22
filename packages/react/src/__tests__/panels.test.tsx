// @vitest-environment jsdom
import { useState } from "react";
import { act, cleanup, fireEvent, render, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BIOMES, MAX_FLAME_LEVEL, MAX_SKILL_POINTS_ABSOLUTE, type SkillSelection } from "@enshrouded/core";

import { usePoints, useSkillSearch, useStats } from "../hooks";
import { PointsPanel } from "../PointsPanel";
import { SkillSearch } from "../SkillSearch";
import { StatsList } from "../StatsPanel";
import { SkillTreeProvider } from "../SkillTreeProvider";
import { GameButton } from "../kit/GameButton";

afterEach(cleanup);

describe("hooks", () => {
  it("usePoints sums the build against the budget and keeps its result while nothing changes", () => {
    const selection: SkillSelection = { "17": 1 };
    const { result, rerender } = renderHook(({ biomes }) => usePoints(selection, { biomes }), {
      initialProps: { biomes: BIOMES.map((b) => b.id) },
    });
    expect(result.current).toEqual({ used: 1, max: MAX_SKILL_POINTS_ABSOLUTE, left: MAX_SKILL_POINTS_ABSOLUTE - 1, full: false, over: false });
    const first = result.current;
    // A new array with the same biomes recomputes nothing.
    rerender({ biomes: BIOMES.map((b) => b.id) });
    expect(result.current).toBe(first);
    rerender({ biomes: [] });
    expect(result.current.max).toBe(MAX_SKILL_POINTS_ABSOLUTE - BIOMES.reduce((sum, b) => sum + b.explorationPoints, 0));
  });

  it("useStats adds the flame altar", () => {
    const { result } = renderHook(() => useStats({ "17": 1 }, 3));
    expect(result.current.CONS).toBe(3);
    expect(result.current.STR).toBe(2);
  });

  it("useSkillSearch returns stable highlight types for the view", () => {
    const { result, rerender } = renderHook(({ query }) => useSkillSearch(query, "en"), { initialProps: { query: "double ju" } });
    expect(result.current.highlightedTypes[0]).toBe("DOUBLE_JUMP");
    const first = result.current.highlightedTypes;
    rerender({ query: "double ju" });
    expect(result.current.highlightedTypes).toBe(first);
    rerender({ query: "do" });
    expect(result.current.highlightedTypes).toEqual([]);
  });
});

describe("PointsPanel", () => {
  it("shows the points used in red only when over the budget", () => {
    const used = (pointsUsed: number) => {
      const { container, unmount } = render(<PointsPanel pointsUsed={pointsUsed} maxPoints={10} />);
      const value = container.querySelector('[data-hud="points-used"]')?.getAttribute("data-over");
      unmount();
      return value;
    };
    expect(used(9)).toBe("false");
    expect(used(10)).toBe("false");
    expect(used(11)).toBe("true");
  });

  it("shows points and edits the flame level and the biome budget through callbacks", () => {
    const onFlame = vi.fn();
    const onLevel = vi.fn();
    const onBiomes = vi.fn();
    const { container, getByRole } = render(
      <SkillTreeProvider locale="fr">
        <PointsPanel
          pointsUsed={12}
          maxPoints={10}
          flameLevel={MAX_FLAME_LEVEL}
          onFlameLevelChange={onFlame}
          playerLevel={50}
          biomes={["springlands"]}
          onPlayerLevelChange={onLevel}
          onBiomesChange={onBiomes}
        />
      </SkillTreeProvider>
    );
    expect(container.querySelector('[data-hud="points-used"]')!.textContent).toBe("12");
    expect(container.querySelector('[data-hud="points-used"]')!.className).toContain("!text-[#ef4444]");
    expect(container.querySelector('[data-hud="points-max"]')!.textContent).toBe("/ 10");
    expect((container.querySelector('[data-hud="flame-up"]') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(container.querySelector('[data-hud="flame-down"]')!);
    expect(onFlame).toHaveBeenCalledWith(MAX_FLAME_LEVEL - 1);
    // French text from the provider's locale, assets from its base URL.
    expect(container.querySelector('img[src="/skill-tree/ui/flame.png"]')!.getAttribute("alt")).toBe("Icône de flamme");

    fireEvent.click(getByRole("button", { name: "Budget par biome" }));
    const dialog = document.querySelector('[data-dialog="biome-budget"]')!;
    expect(dialog.textContent).toContain("Hautes pâtures");
    fireEvent.click(dialog.querySelector('[data-biome="revelwood"]')!);
    expect(onBiomes).toHaveBeenCalledWith(["springlands", "revelwood"]);
    fireEvent.change(dialog.querySelector('[data-budget="player-level"]')!, { target: { value: "99" } });
    expect(onLevel).toHaveBeenCalledWith(50);
  });

  it("is read-only without callbacks", () => {
    const { container } = render(<PointsPanel pointsUsed={1} maxPoints={10} flameLevel={2} layout="bar" />);
    expect(container.querySelector('[data-hud="biome-budget"]')).toBeNull();
    expect((container.querySelector('[data-hud="flame-up"]') as HTMLButtonElement).disabled).toBe(true);
    expect(container.querySelector('[data-points-panel="bar"]')).not.toBeNull();
  });
});

describe("StatsList", () => {
  it("lists every stat with its label", () => {
    const { container } = render(<StatsList stats={{ STR: 4 }} />);
    expect(container.querySelector('[data-stat="STR"]')!.textContent).toBe("4");
    expect(container.querySelector('[data-stat="INT"]')!.textContent).toBe("0");
    expect(container.textContent).toContain("Strength");
  });
});

describe("SkillSearch", () => {
  const Search = ({ onFocusNode }: { onFocusNode: (id: string) => void }) => {
    const [query, setQuery] = useState("");
    const { results } = useSkillSearch(query, "en");
    return <SkillSearch query={query} onQueryChange={setQuery} results={results} onFocusNode={onFocusNode} maxResults={2} />;
  };

  it("lists matches, counts the rest, and focuses a single-node skill on Enter", () => {
    const onFocusNode = vi.fn();
    const { container } = render(<Search onFocusNode={onFocusNode} />);
    const input = container.querySelector('[data-hud="search-input"]') as HTMLInputElement;
    act(() => input.focus());
    fireEvent.change(input, { target: { value: "jump" } });
    expect(container.querySelectorAll("[data-search-result]")).toHaveLength(2);
    expect(container.textContent).toMatch(/\+\d+ more matches highlighted on the tree/);
    fireEvent.change(input, { target: { value: "double ju" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(input.value).toBe("Double Jump");
    expect(onFocusNode).toHaveBeenCalledWith("12");
    expect(container.querySelectorAll("[data-search-result]")).toHaveLength(0);
  });
});

describe("GameButton", () => {
  it("plays the provider's hover sound unless disabled", () => {
    const sound = vi.fn();
    const { getByText } = render(
      <SkillTreeProvider sound={sound}>
        <GameButton>On</GameButton>
        <GameButton disabled>Off</GameButton>
      </SkillTreeProvider>
    );
    fireEvent.mouseEnter(getByText("On").closest("button")!);
    fireEvent.mouseEnter(getByText("Off").closest("button")!);
    expect(sound).toHaveBeenCalledTimes(1);
    expect(sound).toHaveBeenCalledWith("node-hover", 0.3);
  });
});
