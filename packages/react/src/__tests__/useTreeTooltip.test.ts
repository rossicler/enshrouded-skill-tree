// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DOUBLE_TAP_MS, TOOLTIP_CLOSE_DELAY_MS, TOOLTIP_OPEN_DELAY_MS, useTreeTooltip } from "../tooltip/useTreeTooltip";

// The tree's nodes for these tests: elements with data-node-id inside `tree`.
let tree: HTMLDivElement;
let ownNode: HTMLElement;
let tooltipEl: HTMLDivElement;
let outside: HTMLDivElement;

const setup = (root = tree) => {
  const hook = renderHook(() => useTreeTooltip({ isOwnNode: (target) => root.contains(target) && !!(target as Element).closest?.("[data-node-id]") }));
  return hook;
};

const press = (target: Element) => act(() => target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })));
const key = (k: string) => act(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true })));
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

beforeEach(() => {
  vi.useFakeTimers();
  tree = document.createElement("div");
  ownNode = document.createElement("div");
  ownNode.setAttribute("data-node-id", "1");
  tree.append(ownNode);
  tooltipEl = document.createElement("div");
  outside = document.createElement("div");
  document.body.append(tree, tooltipEl, outside);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("useTreeTooltip", () => {
  it("opens after the hover delay, and leaving first cancels it", () => {
    const { result } = setup();
    act(() => result.current.showOnHover("1"));
    advance(TOOLTIP_OPEN_DELAY_MS - 1);
    expect(result.current.isOpen).toBe(false);
    act(() => result.current.hideOnLeave());
    advance(TOOLTIP_OPEN_DELAY_MS);
    expect(result.current.isOpen).toBe(false);

    act(() => result.current.showOnHover("1"));
    advance(TOOLTIP_OPEN_DELAY_MS);
    expect(result.current.tip).toEqual({ nodeId: "1", open: true });
  });

  it("closes a moment after the pointer leaves an open tooltip's node", () => {
    const { result } = setup();
    act(() => result.current.open("1"));
    act(() => result.current.hideOnLeave());
    expect(result.current.isOpen).toBe(true);
    advance(TOOLTIP_CLOSE_DELAY_MS);
    // Closed, but the node is kept so the card keeps its content.
    expect(result.current.tip).toEqual({ nodeId: "1", open: false });
  });

  it("opens after the double-tap window, and a second tap cancels it", () => {
    const { result } = setup();
    act(() => result.current.showAfterTap("1"));
    advance(DOUBLE_TAP_MS - 1);
    expect(result.current.isOpen).toBe(false);
    advance(1);
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.close());
    act(() => result.current.showAfterTap("2"));
    advance(DOUBLE_TAP_MS / 2);
    act(() => result.current.cancelPending());
    advance(DOUBLE_TAP_MS);
    expect(result.current.isOpen).toBe(false);
  });

  it("switches at once to another hovered node while open", () => {
    const { result } = setup();
    act(() => result.current.open("1"));
    act(() => result.current.showOnHover("2"));
    expect(result.current.tip).toEqual({ nodeId: "2", open: true });
  });

  it("closes on Escape", () => {
    const { result } = setup();
    act(() => result.current.open("1"));
    key("Enter");
    expect(result.current.isOpen).toBe(true);
    key("Escape");
    expect(result.current.isOpen).toBe(false);
  });

  it("closes on a press outside, but not in the tooltip or on the tree's nodes", () => {
    const { result } = setup();
    act(() => result.current.open("1"));
    (result.current.tooltipRef as { current: HTMLDivElement | null }).current = tooltipEl;
    press(tooltipEl);
    press(ownNode);
    expect(result.current.isOpen).toBe(true);
    press(outside);
    expect(result.current.isOpen).toBe(false);
  });

  it("keeps a focus open through a hover leave, and drops it on a user move", () => {
    const { result } = setup();
    act(() => result.current.openAfterFocus("1", 350));
    act(() => result.current.hideOnLeave());
    act(() => result.current.close());
    advance(350);
    expect(result.current.tip).toEqual({ nodeId: "1", open: true });

    act(() => result.current.close());
    act(() => result.current.openAfterFocus("2", 350));
    act(() => result.current.onUserMove());
    advance(350);
    expect(result.current.isOpen).toBe(false);
  });

  it("keeps two trees' tooltips apart", () => {
    const otherTree = document.createElement("div");
    const otherNode = document.createElement("div");
    otherNode.setAttribute("data-node-id", "1");
    otherTree.append(otherNode);
    document.body.append(otherTree);
    const a = setup();
    const b = setup(otherTree);

    act(() => a.result.current.open("1"));
    expect(b.result.current.isOpen).toBe(false);
    act(() => b.result.current.showOnHover("1"));
    advance(TOOLTIP_OPEN_DELAY_MS);
    expect(a.result.current.isOpen).toBe(true);
    expect(b.result.current.isOpen).toBe(true);

    // A press on the other tree's node is outside for this one.
    press(otherNode);
    expect(a.result.current.isOpen).toBe(false);
    expect(b.result.current.isOpen).toBe(true);
    key("Escape");
    expect(b.result.current.isOpen).toBe(false);
  });
});
