// @vitest-environment jsdom
import { memo, useState } from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { SkillSelection } from "@enshrouded/core";

import { SkillTreeCard } from "../SkillTreeCard";

// Node renders that get past memo, tagged with the tree instance's scope.
const renders = vi.hoisted(() => ({ nodes: [] as string[] }));
vi.mock("../svg/SkillNode", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../svg/SkillNode")>();
  return {
    ...mod,
    SkillNode: memo((props: Parameters<typeof mod.SkillNodeBase>[0]) => {
      renders.nodes.push(`${props.scope}:${props.id}`);
      return mod.SkillNodeBase(props);
    }),
  };
});

const SINGLE_BASE = "17";

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} })) as never;
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never;
});
afterEach(cleanup);

// Two cards with their own state, as two widgets on one page would be.
const Two = () => {
  const [a, setA] = useState<SkillSelection>({});
  const [b, setB] = useState<SkillSelection>({});
  return (
    <>
      <div data-testid="a">
        <SkillTreeCard selection={a} onSelectionChange={setA} />
      </div>
      <div data-testid="b">
        <SkillTreeCard selection={b} onSelectionChange={setB} />
      </div>
    </>
  );
};

const scopeOf = (root: Element) => root.querySelector("[data-skill-tree-scope]")!.getAttribute("data-skill-tree-scope")!;

describe("SkillTreeCard", () => {
  it("an action in one card re-renders nothing in the other", () => {
    const { getByTestId } = render(<Two />);
    const a = getByTestId("a");
    const b = getByTestId("b");
    const scopeA = scopeOf(a);
    const scopeB = scopeOf(b);
    expect(scopeA).not.toBe(scopeB);
    // No shared element ids between the two cards.
    const ids = (root: Element) => Array.from(root.querySelectorAll("[id]"), (el) => el.id);
    expect(ids(a).filter((id) => ids(b).includes(id))).toEqual([]);

    renders.nodes.length = 0;
    act(() => void fireEvent.click(a.querySelector(`[data-node-id="${SINGLE_BASE}"]`)!));
    expect(a.querySelector(`[data-node-id="${SINGLE_BASE}"]`)!.getAttribute("data-level")).toBe("1");
    expect(b.querySelector(`[data-node-id="${SINGLE_BASE}"]`)!.getAttribute("data-level")).toBe("0");
    expect(renders.nodes.length).toBeGreaterThan(0);
    expect(renders.nodes.filter((r) => !r.startsWith(`${scopeA}:`))).toEqual([]);
  });

  it("read-only ignores clicks", () => {
    const onChange = vi.fn();
    const { container } = render(<SkillTreeCard selection={{}} onSelectionChange={onChange} readOnly />);
    act(() => void fireEvent.click(container.querySelector(`[data-node-id="${SINGLE_BASE}"]`)!));
    act(() => void fireEvent.contextMenu(container.querySelector(`[data-node-id="${SINGLE_BASE}"]`)!));
    expect(onChange).not.toHaveBeenCalled();
    expect(container.querySelector("[data-skill-tree-card]")!.getAttribute("data-read-only")).toBe("true");
  });

  it("expand opens an overlay with the same build; Esc closes it and focuses the card", () => {
    const { container } = render(<SkillTreeCard selection={{ [SINGLE_BASE]: 1 }} />);
    const card = container.querySelector<HTMLElement>("[data-skill-tree-card]")!;
    act(() => void fireEvent.click(card.querySelector('[data-card-action="expand"]')!));
    const overlay = document.querySelector("[data-skill-tree-card-overlay]")!;
    expect(overlay).not.toBeNull();
    expect(card.getAttribute("data-card-mode")).toBe("expanded");
    expect(overlay.querySelector(`[data-node-id="${SINGLE_BASE}"]`)!.getAttribute("data-level")).toBe("1");
    act(() => void fireEvent.keyDown(overlay.querySelector('[role="dialog"]')!, { key: "Escape" }));
    expect(document.querySelector("[data-skill-tree-card-overlay]")).toBeNull();
    expect(document.activeElement).toBe(card);
  });

  it("fullscreen falls back to the overlay where the browser has none", () => {
    // jsdom has no Fullscreen API, like iOS Safari for anything but video.
    const { container } = render(<SkillTreeCard selection={{}} />);
    const card = container.querySelector<HTMLElement>("[data-skill-tree-card]")!;
    act(() => void fireEvent.click(card.querySelector('[data-card-action="fullscreen"]')!));
    expect(card.getAttribute("data-card-mode")).toBe("expanded");
    expect(document.querySelector("[data-skill-tree-card-overlay]")).not.toBeNull();
  });

  it("takes the default size when its container gives none", () => {
    // jsdom lays nothing out, so every container measures 0.
    const { container } = render(<SkillTreeCard selection={{}} />);
    const card = container.querySelector<HTMLElement>("[data-skill-tree-card]")!;
    expect(card.style.width).toBe("360px");
    expect(card.style.height).toBe("360px");
  });
});
