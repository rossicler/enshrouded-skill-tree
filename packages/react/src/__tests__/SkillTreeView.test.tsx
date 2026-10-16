// @vitest-environment jsdom
import { Profiler, createRef, memo, useState } from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SkillNodes, getSelectableSkills, getSkillsToRemove, type SkillSelection } from "@enshrouded/core";

import { SkillTreeProvider, type SkillTreeNotice } from "../SkillTreeProvider";
import { SkillTreeView, type SkillTreeViewHandle, type SkillTreeViewProps } from "../SkillTreeView";
import { getTreeLayout } from "../layout";

// Count the renders that get past memo: the mocks wrap the real components'
// render functions, keeping their memo.
const renders = vi.hoisted(() => ({ nodes: [] as string[], links: [] as string[] }));
vi.mock("../svg/SkillNode", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../svg/SkillNode")>();
  return {
    ...mod,
    SkillNode: memo((props: Parameters<typeof mod.SkillNodeBase>[0]) => {
      renders.nodes.push(props.id);
      return mod.SkillNodeBase(props);
    }),
  };
});
vi.mock("../svg/SkillLink", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../svg/SkillLink")>();
  return {
    ...mod,
    SkillLink: memo((props: Parameters<typeof mod.SkillLinkBase>[0]) => {
      renders.links.push(props.link.key);
      return mod.SkillLinkBase(props);
    }),
  };
});

// Tree facts (same fixtures as the browser tests).
const SINGLE_BASE = "17";
const MULTI_BASE = "2";
const MULTI_BASE_CHILD = "1";

beforeAll(() => {
  // jsdom has neither; the view only needs them to exist.
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} })) as never;
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never;
});

beforeEach(() => {
  renders.nodes.length = 0;
  renders.links.length = 0;
});
afterEach(cleanup);

// What a node and a link look like for a selection: exactly the props that
// make them re-render.
const nodeProps = (selection: SkillSelection, highlighted: string[] = []) => {
  const selectable = new Set(getSelectableSkills(selection));
  return Object.fromEntries(
    Object.values(SkillNodes.nodes).map((n) => [
      n.id,
      `${selection[n.id] != null ? "selected" : selectable.has(n.id) ? "selectable" : "locked"}/${selection[n.id] ?? 0}/${highlighted.includes(n.type)}`,
    ])
  );
};
const linkProps = (selection: SkillSelection) =>
  Object.fromEntries(
    getTreeLayout().links.map((l) => [l.key, l.kind === "base" ? selection[l.from] != null : selection[l.from] != null && selection[l.to] != null])
  );
const changed = (before: Record<string, unknown>, after: Record<string, unknown>) =>
  Object.keys(after).filter((key) => before[key] !== after[key]).sort();

type HostProps = Omit<SkillTreeViewProps, "selection" | "onSelectionChange"> & {
  initial?: SkillSelection;
  onNotice?: (notice: SkillTreeNotice) => void;
  sound?: (name: string, volume: number) => void;
  hardCap?: number;
  onCommit?: () => void;
  viewRef?: React.Ref<SkillTreeViewHandle>;
};

let current: SkillSelection = {};
const Host = ({ initial = {}, onNotice, sound, hardCap, onCommit, viewRef, ...props }: HostProps) => {
  const [selection, setSelection] = useState(initial);
  current = selection;
  return (
    <SkillTreeProvider sound={sound} hardCap={hardCap} onNotice={onNotice}>
      <Profiler id="tree" onRender={() => onCommit?.()}>
        <SkillTreeView ref={viewRef} selection={selection} onSelectionChange={setSelection} {...props} />
      </Profiler>
    </SkillTreeProvider>
  );
};

const nodeEl = (container: HTMLElement, id: string) => container.querySelector(`[data-node-id="${id}"]`)!;
const click = (container: HTMLElement, id: string) => act(() => void fireEvent.click(nodeEl(container, id)));
const rightClick = (container: HTMLElement, id: string) => act(() => void fireEvent.contextMenu(nodeEl(container, id)));

// Clicks a node and checks that exactly the nodes and links whose props
// changed re-rendered, in one commit.
const expectMinimalRender = (container: HTMLElement, id: string, action: (c: HTMLElement, id: string) => void, highlighted?: string[]) => {
  const before = { nodes: nodeProps(current, highlighted), links: linkProps(current) };
  let commits = 0;
  renders.nodes.length = 0;
  renders.links.length = 0;
  return {
    commitsRef: () => commits,
    run(onCommit: { count: () => void }) {
      onCommit.count = () => commits++;
      action(container, id);
      const after = { nodes: nodeProps(current, highlighted), links: linkProps(current) };
      expect([...renders.nodes].sort()).toEqual(changed(before.nodes, after.nodes));
      expect([...renders.links].sort()).toEqual(changed(before.links, after.links));
      return { commits, nodes: renders.nodes.length, links: renders.links.length };
    },
  };
};

describe("SkillTreeView", () => {
  it("draws every node and link of the tree once", () => {
    const { container } = render(<Host />);
    const layout = getTreeLayout();
    expect(container.querySelectorAll("[data-node-id]")).toHaveLength(layout.nodeIds.length);
    expect(container.querySelectorAll("line[data-link-from]")).toHaveLength(layout.links.length);
    expect(renders.nodes).toHaveLength(layout.nodeIds.length);
    expect(renders.links).toHaveLength(layout.links.length);
  });

  it("re-renders only the nodes and links an action changes", () => {
    const hooks = { count: () => {} };
    const { container } = render(<Host onCommit={() => hooks.count()} />);
    const total = getTreeLayout().nodeIds.length;

    const steps: [string, (c: HTMLElement, id: string) => void][] = [
      [SINGLE_BASE, click], // unlock a base node: it and its neighbors change
      [MULTI_BASE, click], // another base node
      [MULTI_BASE, click], // level up: only the node itself
      [MULTI_BASE_CHILD, click], // a neighbor: it, its own neighbors and one link
      [MULTI_BASE, rightClick], // level down: only the node
    ];
    for (const [id, action] of steps) {
      const result = expectMinimalRender(container, id, action).run(hooks);
      expect(result.commits).toBe(1);
      expect(result.nodes).toBeLessThan(total / 10);
    }
    expect(current).toEqual({ [SINGLE_BASE]: 1, [MULTI_BASE]: 1, [MULTI_BASE_CHILD]: 1 });
  });

  it("re-renders nothing for a refused click, and only matches for a search", () => {
    const notices: SkillTreeNotice[] = [];
    const hooks = { count: () => {} };
    const { container, rerender } = render(<Host onCommit={() => hooks.count()} onNotice={(n) => notices.push(n)} />);
    const outOfRange = MULTI_BASE_CHILD;
    expectMinimalRender(container, outOfRange, click).run(hooks);
    expect(renders.nodes).toEqual([]);
    expect(notices).toEqual([{ type: "out-of-range", nodeId: outOfRange }]);

    renders.nodes.length = 0;
    const type = SkillNodes.nodes["12"].type;
    rerender(<Host highlightedTypes={[type]} />);
    expect(renders.nodes).toEqual(Object.values(SkillNodes.nodes).filter((n) => n.type === type).map((n) => n.id));
    expect(nodeEl(container, "12").getAttribute("data-searched")).toBe("true");
  });

  it("applies the planner rules: confirm before a cascade, hard cap, sounds", async () => {
    const sounds: string[] = [];
    const notices: SkillTreeNotice[] = [];
    let answer = false;
    const confirmRefund = vi.fn(async () => answer);
    const { container, rerender } = render(
      <Host sound={(name) => sounds.push(name)} onNotice={(n) => notices.push(n)} confirmRefund={confirmRefund} />
    );
    click(container, MULTI_BASE);
    click(container, MULTI_BASE_CHILD);
    expect(sounds).toEqual(["node-unlock", "node-unlock"]);

    // A refund that takes the child along asks first.
    const removed = getSkillsToRemove(MULTI_BASE, Object.keys(current));
    await act(async () => void fireEvent.contextMenu(nodeEl(container, MULTI_BASE)));
    expect(confirmRefund).toHaveBeenLastCalledWith({ nodeId: MULTI_BASE, removed });
    expect(current).toEqual({ [MULTI_BASE]: 1, [MULTI_BASE_CHILD]: 1 });
    answer = true;
    await act(async () => void fireEvent.contextMenu(nodeEl(container, MULTI_BASE)));
    expect(current).toEqual({});
    expect(sounds.at(-1)).toBe("node-refund");

    // The hard cap refuses an unlock and tells the host.
    rerender(<Host sound={(name) => sounds.push(name)} onNotice={(n) => notices.push(n)} hardCap={0} />);
    click(container, SINGLE_BASE);
    expect(current).toEqual({});
    expect(notices.at(-1)).toEqual({ type: "hard-cap", nodeId: SINGLE_BASE, maxPoints: 0 });
  });

  it("is read-only without onSelectionChange", () => {
    const { container } = render(<SkillTreeView selection={{ [SINGLE_BASE]: 1 }} />);
    fireEvent.click(nodeEl(container, MULTI_BASE));
    expect(nodeEl(container, MULTI_BASE).getAttribute("data-level")).toBe("0");
    expect(nodeEl(container, SINGLE_BASE).getAttribute("data-state")).toBe("selected");
  });

  it("keeps several instances on one page apart", () => {
    const { container } = render(
      <>
        <Host />
        <Host />
      </>
    );
    const [a, b] = Array.from(container.querySelectorAll<HTMLElement>("[data-skill-tree-scope]"));
    expect(a.dataset.skillTreeScope).not.toBe(b.dataset.skillTreeScope);
    const ids = Array.from(container.querySelectorAll("[id]")).map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
    act(() => void fireEvent.click(a.querySelector(`[data-node-id="${SINGLE_BASE}"]`)!));
    expect(a.querySelector(`[data-node-id="${SINGLE_BASE}"]`)!.getAttribute("data-level")).toBe("1");
    expect(b.querySelector(`[data-node-id="${SINGLE_BASE}"]`)!.getAttribute("data-level")).toBe("0");
  });

  it("exposes zoom controls", () => {
    const view = createRef<SkillTreeViewHandle>();
    render(<Host viewRef={view} />);
    expect(Object.keys(view.current!).sort()).toEqual(["center", "focusNode", "zoomIn", "zoomOut"]);
    expect(() => {
      view.current!.zoomIn();
      view.current!.zoomOut();
      view.current!.center();
      view.current!.focusNode(SINGLE_BASE, { animationMs: 0 });
    }).not.toThrow();
  });
});
