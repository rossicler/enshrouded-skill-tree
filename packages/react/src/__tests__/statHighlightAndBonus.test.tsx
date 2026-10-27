// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BIOMES, MAX_PLAYER_LEVEL, SkillNodes, computeMaxSkillPoints, type StatsType } from "@enshrouded/core";

import { BiomeBudgetDialog, PointsPanel } from "../PointsPanel";
import { STAT_HIGHLIGHT_COLORS, StatHighlightButton, getStatMarkers } from "../StatHighlight";
import { SkillTreeProvider } from "../SkillTreeProvider";
import { SkillTreeView } from "../SkillTreeView";
import { StatsToggle } from "../StatsPanel";

afterEach(cleanup);

const ALL = BIOMES.map((b) => b.id);

describe("editable total in the biome budget", () => {
  const BASE = computeMaxSkillPoints(MAX_PLAYER_LEVEL, ALL);
  const Dialog = ({ bonus, onBonus }: { bonus: number; onBonus: (n: number) => void }) => (
    <BiomeBudgetDialog
      open
      onClose={() => {}}
      playerLevel={MAX_PLAYER_LEVEL}
      biomes={ALL}
      onPlayerLevelChange={() => {}}
      onBiomesChange={() => {}}
      bonusPoints={bonus}
      onBonusPointsChange={onBonus}
    />
  );
  const dialog = () => document.querySelector('[data-dialog="biome-budget"]')!;
  const total = () => dialog().querySelector('[data-budget="total"]') as HTMLInputElement;

  it("shows the total with − and + around it", () => {
    const onBonus = vi.fn();
    render(<Dialog bonus={4} onBonus={onBonus} />);
    expect(total().value).toBe(String(BASE + 4));
    expect(dialog().querySelector('[data-budget="bonus-points"]')!.textContent).toContain("+4");
    fireEvent.click(dialog().querySelector('[data-budget="bonus-up"]')!);
    expect(onBonus).toHaveBeenLastCalledWith(5);
    fireEvent.click(dialog().querySelector('[data-budget="bonus-down"]')!);
    expect(onBonus).toHaveBeenLastCalledWith(3);
  });

  it("commits a typed total on Enter or blur, not per key press", () => {
    const onBonus = vi.fn();
    render(<Dialog bonus={0} onBonus={onBonus} />);
    expect(dialog().querySelector('[data-budget="bonus-points"]')).toBeNull();
    fireEvent.change(total(), { target: { value: "2" } });
    fireEvent.change(total(), { target: { value: String(BASE - 7) } });
    expect(onBonus).not.toHaveBeenCalled();
    fireEvent.keyDown(total(), { key: "Enter" });
    expect(onBonus).toHaveBeenCalledTimes(1);
    expect(onBonus).toHaveBeenLastCalledWith(-7);
    fireEvent.change(total(), { target: { value: String(BASE + 2) } });
    fireEvent.blur(total());
    expect(onBonus).toHaveBeenLastCalledWith(2);
  });

  it("accepts digits only", () => {
    const onBonus = vi.fn();
    render(<Dialog bonus={0} onBonus={onBonus} />);
    for (const bad of ["12abc", "-5", "1e3", "12.5", " 7"]) {
      fireEvent.change(total(), { target: { value: bad } });
      expect(total().value).toBe(String(BASE));
    }
    fireEvent.blur(total());
    expect(onBonus).not.toHaveBeenCalled();
  });

  it("keeps the total when the field is left empty, and Escape drops an edit", () => {
    const onBonus = vi.fn();
    render(<Dialog bonus={0} onBonus={onBonus} />);
    fireEvent.change(total(), { target: { value: "" } });
    expect(total().value).toBe("");
    fireEvent.blur(total());
    expect(total().value).toBe(String(BASE));
    fireEvent.change(total(), { target: { value: "5" } });
    fireEvent.keyDown(total(), { key: "Escape" });
    expect(total().value).toBe(String(BASE));
    fireEvent.blur(total());
    expect(onBonus).not.toHaveBeenCalled();
  });

  it("steps − and + from a pending edit", () => {
    const onBonus = vi.fn();
    render(<Dialog bonus={0} onBonus={onBonus} />);
    fireEvent.change(total(), { target: { value: String(BASE + 10) } });
    fireEvent.click(dialog().querySelector('[data-budget="bonus-up"]')!);
    expect(onBonus).toHaveBeenLastCalledWith(11);
  });

  it("stops − at a total of 0, and Unlock all clears the bonus", () => {
    const onBonus = vi.fn();
    render(<Dialog bonus={-BASE} onBonus={onBonus} />);
    expect(total().value).toBe("0");
    expect((dialog().querySelector('[data-budget="bonus-down"]') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(Array.from(dialog().querySelectorAll("button")).find((b) => b.textContent === "Unlock all")!);
    expect(onBonus).toHaveBeenLastCalledWith(0);
  });

  it("shows a plain total without the callback", () => {
    render(
      <BiomeBudgetDialog open onClose={() => {}} playerLevel={10} biomes={[]} onPlayerLevelChange={() => {}} onBiomesChange={() => {}} />
    );
    expect(document.querySelector('[data-budget="bonus-up"]')).toBeNull();
    expect(document.querySelector('[data-budget="total"]')!.tagName).toBe("SPAN");
  });
});

describe("stat highlight", () => {
  it("maps stats to their node types and colors", () => {
    const markers = getStatMarkers(["INT", "DEX", "nonsense"]);
    expect(markers.ATTR_INT).toEqual([STAT_HIGHLIGHT_COLORS.INT]);
    expect(markers.ATTR_DEX).toEqual([STAT_HIGHLIGHT_COLORS.DEX]);
    expect(markers.ATTR_STR).toBeUndefined();
    expect(getStatMarkers([])).toEqual({});
  });

  it("splits a two-stat node only when both of its stats are highlighted", () => {
    expect(getStatMarkers(["DEX"]).RANGER).toEqual([STAT_HIGHLIGHT_COLORS.DEX]);
    expect(getStatMarkers(["ENDURANCE"]).RANGER).toEqual([STAT_HIGHLIGHT_COLORS.ENDURANCE]);
    const both = [STAT_HIGHLIGHT_COLORS.ENDURANCE, STAT_HIGHLIGHT_COLORS.DEX];
    // Same colors in the same order, whatever order the stats were toggled in.
    expect(getStatMarkers(["DEX", "ENDURANCE"]).RANGER).toEqual(both);
    expect(getStatMarkers(["ENDURANCE", "DEX"]).RANGER).toEqual(both);
  });

  it("toggles stats from the panel", () => {
    const Wired = () => {
      const [stats, setStats] = useState<StatsType[]>([]);
      return <StatHighlightButton value={stats} onChange={setStats} />;
    };
    const { container } = render(<Wired />);
    expect(container.querySelector('[data-panel="stat-highlight"]')).toBeNull();
    fireEvent.click(container.querySelector('[data-hud="stat-highlight"]')!);
    const toggle = (stat: string) => container.querySelector(`[data-stat-highlight="${stat}"]`)!;
    fireEvent.click(toggle("INT"));
    expect(toggle("INT").getAttribute("aria-checked")).toBe("true");
    expect(toggle("STR").getAttribute("aria-checked")).toBe("false");
    fireEvent.click(Array.from(container.querySelectorAll("button")).find((b) => b.textContent === "All")!);
    expect(container.querySelectorAll('[aria-checked="true"]').length).toBe(6);
    fireEvent.click(Array.from(container.querySelectorAll("button")).find((b) => b.textContent === "None")!);
    expect(container.querySelectorAll('[aria-checked="true"]').length).toBe(0);
  });

  it("rings the marked nodes on the tree", () => {
    const { container } = render(
      <SkillTreeProvider>
        <SkillTreeView selection={{}} markedTypes={getStatMarkers(["SPIRIT"])} />
      </SkillTreeProvider>
    );
    const marked = Array.from(container.querySelectorAll('[data-marked="true"]'));
    const spiritNodes = Object.values(SkillNodes.nodes).filter((n) => SkillNodes.types[n.type]?.stats?.SPIRIT);
    expect(marked.length).toBe(spiritNodes.length);
    expect(marked.every((el) => SkillNodes.types[el.getAttribute("data-node-type")!]?.stats?.SPIRIT)).toBe(true);
  });

  it("draws a split ring on the tree for a node with two highlighted stats", () => {
    const { container } = render(
      <SkillTreeProvider>
        <SkillTreeView selection={{}} markedTypes={getStatMarkers(["DEX", "ENDURANCE"])} />
      </SkillTreeProvider>
    );
    // The hit area carries the data attributes; its group holds the drawing.
    const hit = (type: string) => container.querySelector(`[data-node-type="${type}"]`)!;
    const group = (type: string) => hit(type).parentElement!;
    expect(hit("RANGER").getAttribute("data-marker-count")).toBe("2");
    const arcs = Array.from(group("RANGER").querySelectorAll("[data-marker-arc]")).map((el) => el.getAttribute("data-marker-arc"));
    expect(arcs).toEqual([STAT_HIGHLIGHT_COLORS.ENDURANCE, STAT_HIGHLIGHT_COLORS.DEX]);
    for (const path of group("RANGER").querySelectorAll("[data-marker-arc] path")) {
      expect(path.getAttribute("d")).toMatch(/^M [-\d.]+ [-\d.]+ /);
      expect(path.getAttribute("d")).not.toMatch(/NaN/);
    }
    // A one-stat node keeps a whole ring.
    expect(hit("ATTR_DEX").getAttribute("data-marker-count")).toBe("1");
    expect(group("ATTR_DEX").querySelector("[data-marker-arc]")).toBeNull();
  });

  it("puts the highlight dots out of the button's flow", () => {
    const { container } = render(<StatHighlightButton value={["SPIRIT", "STR"]} onChange={() => {}} />);
    const dots = container.querySelector('[data-stat-highlight="dots"]')!;
    expect(dots.className).toContain("absolute");
    expect(dots.children.length).toBe(2);
  });
});

describe("stats toggle", () => {
  it("opens the stats below the button and closes them on a second click", () => {
    const { container } = render(<StatsToggle stats={{ STR: 3, INT: 5 }} />);
    const button = container.querySelector('[data-hud="stats"]')!;
    const panel = () => container.querySelector('[data-panel="stats"]');
    expect(panel()).toBeNull();
    expect(button.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(button);
    expect(panel()!.querySelector('[data-stat="STR"]')!.textContent).toBe("3");
    expect(panel()!.querySelector('[data-stat="INT"]')!.textContent).toBe("5");
    expect(button.getAttribute("aria-expanded")).toBe("true");
    // Not a dialog: nothing modal opens.
    expect(document.querySelector('[data-dialog="stats"]')).toBeNull();
    fireEvent.click(button);
    expect(panel()).toBeNull();
  });
});

describe("HUD toggles", () => {
  it("close on Escape and hand focus back to the button", () => {
    const { container } = render(<StatsToggle stats={{}} />);
    const button = container.querySelector<HTMLButtonElement>('[data-hud="stats"]')!;
    fireEvent.click(button);
    const panel = container.querySelector('[data-panel="stats"]')!;
    expect(button.getAttribute("aria-controls")).toBe(panel.id);
    panel.setAttribute("tabindex", "-1");
    (panel as HTMLElement).focus();
    fireEvent.keyDown(panel, { key: "Escape" });
    expect(container.querySelector('[data-panel="stats"]')).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  it("stay open on a click elsewhere, so the tree stays usable", () => {
    const { container } = render(<StatsToggle stats={{}} />);
    fireEvent.click(container.querySelector('[data-hud="stats"]')!);
    fireEvent.pointerDown(document.body);
    fireEvent.click(document.body);
    expect(container.querySelector('[data-panel="stats"]')).not.toBeNull();
  });

  it("can be kept to one open panel by a parent", () => {
    const Pair = () => {
      const [openPanel, setOpenPanel] = useState<"stats" | "highlight" | null>(null);
      const control = (panel: "stats" | "highlight") => ({
        open: openPanel === panel,
        onOpenChange: (open: boolean) => setOpenPanel(open ? panel : null),
      });
      return (
        <>
          <StatsToggle stats={{}} {...control("stats")} />
          <StatHighlightButton value={[]} onChange={() => {}} {...control("highlight")} />
        </>
      );
    };
    const { container } = render(<Pair />);
    fireEvent.click(container.querySelector('[data-hud="stats"]')!);
    expect(container.querySelector('[data-panel="stats"]')).not.toBeNull();
    fireEvent.click(container.querySelector('[data-hud="stat-highlight"]')!);
    expect(container.querySelector('[data-panel="stats"]')).toBeNull();
    expect(container.querySelector('[data-panel="stat-highlight"]')).not.toBeNull();
  });

  it("let a host replace the panel height cap", () => {
    const { container } = render(<StatsToggle stats={{}} panelSizeClassName="max-h-40" />);
    fireEvent.click(container.querySelector('[data-hud="stats"]')!);
    const panel = container.querySelector('[data-panel="stats"]')!;
    expect(panel.className).toContain("max-h-40");
    expect(panel.className).not.toContain("45dvh");
    expect(panel.className).toContain("overflow-y-auto");
  });

  it("stay independent when uncontrolled, so two can be open at once", () => {
    const { container } = render(
      <>
        <StatsToggle stats={{}} />
        <StatHighlightButton value={[]} onChange={() => {}} />
      </>
    );
    fireEvent.click(container.querySelector('[data-hud="stats"]')!);
    fireEvent.click(container.querySelector('[data-hud="stat-highlight"]')!);
    expect(container.querySelector('[data-panel="stats"]')).not.toBeNull();
    expect(container.querySelector('[data-panel="stat-highlight"]')).not.toBeNull();
    fireEvent.click(container.querySelector('[data-hud="stats"]')!);
    expect(container.querySelector('[data-panel="stats"]')).toBeNull();
    expect(container.querySelector('[data-panel="stat-highlight"]')).not.toBeNull();
  });

  it("cap the panel height so it scrolls on a short screen", () => {
    const { container } = render(<StatsToggle stats={{}} />);
    fireEvent.click(container.querySelector('[data-hud="stats"]')!);
    const panel = container.querySelector('[data-panel="stats"]')!;
    expect(panel.className).toContain("overflow-y-auto");
    expect(panel.className).toMatch(/max-h-/);
  });
});

describe("bonus on the HUD counter", () => {
  it("shows a non-zero bonus next to the total", () => {
    const { container, rerender } = render(<PointsPanel pointsUsed={5} maxPoints={100} bonusPoints={-3} />);
    const bonus = container.querySelector('[data-hud="points-bonus"]')!;
    expect(bonus.textContent).toBe("(−3)");
    expect(bonus.getAttribute("title")).toContain("−3");
    rerender(<PointsPanel pointsUsed={5} maxPoints={100} bonusPoints={0} />);
    expect(container.querySelector('[data-hud="points-bonus"]')).toBeNull();
    rerender(<PointsPanel pointsUsed={5} maxPoints={100} />);
    expect(container.querySelector('[data-hud="points-bonus"]')).toBeNull();
  });
});
