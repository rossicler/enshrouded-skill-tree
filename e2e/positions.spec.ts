import { expect, test } from "./fixtures";

import skillData from "../src/constants/gameSkillData.json";
import { resolveBaseAnchor, resolveNodePosition } from "../src/utils/nodePosition";
import { openPlanner } from "./helpers";

// The renderer must draw every node where the tree data puts it, and every link
// between the points it joins. Expected screen positions come from the data,
// so a game import that adds, removes or moves nodes needs no update here.
//
// Data coordinates map to the screen by one uniform scale plus an offset (the
// initial view). It is fitted from the measured nodes, then pinned below, so a
// change to the default zoom or centering still fails.
const VIEWPORT = { width: 1280, height: 800 };
const VIEW_SCALE = 0.5;
const VIEW_ORIGIN: Point = [640, 400]; // screen position of the tree center
const TOLERANCE_PX = 1;

type Point = [number, number];
type RawNode = { position: { x: number; y: number }; base?: boolean; baseAnchor?: { x: number; y: number } };

const dataNodes = skillData.nodes as Record<string, RawNode>;
const dataPoint = (id: string): Point => {
  const p = resolveNodePosition({ position: { kind: "cartesian", ...dataNodes[id].position } });
  return [p.x, p.y];
};
const anchorPoint = (id: string): Point => {
  const n = dataNodes[id];
  const p = resolveBaseAnchor({ position: { kind: "cartesian", ...n.position }, baseAnchor: n.baseAnchor });
  return [p.x, p.y];
};

// Least-squares uniform scale + offset from data points to screen points.
const fitView = (pairs: [Point, Point][]) => {
  const n = pairs.length;
  const mean = (f: (p: [Point, Point]) => number) => pairs.reduce((s, p) => s + f(p), 0) / n;
  const [mx, my, sx, sy] = [mean(([d]) => d[0]), mean(([d]) => d[1]), mean(([, s]) => s[0]), mean(([, s]) => s[1])];
  let num = 0;
  let den = 0;
  for (const [[x, y], [X, Y]] of pairs) {
    num += (x - mx) * (X - sx) + (y - my) * (Y - sy);
    den += (x - mx) ** 2 + (y - my) ** 2;
  }
  const scale = num / den;
  return { scale, origin: [sx - scale * mx, sy - scale * my] as Point };
};

test("nodes and links are drawn where the tree data puts them", async ({ page }) => {
  test.skip(test.info().project.name !== "desktop", "checked at the desktop viewport");
  await page.setViewportSize(VIEWPORT);
  await openPlanner(page);

  const measured = await page.evaluate(() => {
    const nodes: Record<string, [number, number]> = {};
    document.querySelectorAll<HTMLElement>("[data-node-id]").forEach((el) => {
      const r = el.getBoundingClientRect();
      nodes[el.dataset.nodeId!] = [r.left + r.width / 2, r.top + r.height / 2];
    });
    const links: { from: string; to: string; kind: string; ends: [[number, number], [number, number]] }[] = [];
    document.querySelectorAll<SVGLineElement>("line[data-link-from]").forEach((line) => {
      const ctm = line.getScreenCTM()!;
      const end = (x: number, y: number): [number, number] => {
        const p = new DOMPoint(x, y).matrixTransform(ctm);
        return [p.x, p.y];
      };
      links.push({
        from: line.dataset.linkFrom!,
        to: line.dataset.linkTo!,
        kind: line.dataset.linkKind!,
        ends: [end(line.x1.baseVal.value, line.y1.baseVal.value), end(line.x2.baseVal.value, line.y2.baseVal.value)],
      });
    });
    return { nodes, links };
  });

  // Every node in the data is drawn, and nothing else.
  expect(Object.keys(measured.nodes).sort()).toEqual(Object.keys(dataNodes).sort());

  const view = fitView(Object.entries(measured.nodes).map(([id, s]) => [dataPoint(id), s]));
  expect(view.scale, "initial zoom changed").toBeCloseTo(VIEW_SCALE, 3);
  expect(Math.abs(view.origin[0] - VIEW_ORIGIN[0]), "tree center moved (x)").toBeLessThanOrEqual(TOLERANCE_PX);
  expect(Math.abs(view.origin[1] - VIEW_ORIGIN[1]), "tree center moved (y)").toBeLessThanOrEqual(TOLERANCE_PX);

  const toScreen = ([x, y]: Point): Point => [VIEW_ORIGIN[0] + VIEW_SCALE * x, VIEW_ORIGIN[1] + VIEW_SCALE * y];
  const near = (a: Point, b: Point) => Math.abs(a[0] - b[0]) <= TOLERANCE_PX && Math.abs(a[1] - b[1]) <= TOLERANCE_PX;
  const fmt = (p: Point) => `[${p[0].toFixed(2)}, ${p[1].toFixed(2)}]`;
  const off: string[] = [];

  for (const [id, s] of Object.entries(measured.nodes)) {
    const want = toScreen(dataPoint(id));
    if (!near(s, want)) off.push(`node ${id}: drawn at ${fmt(s)}, data says ${fmt(want)}`);
  }

  // One line per data edge (either direction) and one per base node.
  const edgeKey = (a: string, b: string) => [a, b].sort().join("-");
  const dataEdges = new Set((skillData.edges as [string, string][]).map(([a, b]) => edgeKey(a, b)));
  const drawnEdges = measured.links.filter((l) => l.kind === "edge").map((l) => edgeKey(l.from, l.to));
  expect(drawnEdges.sort()).toEqual([...dataEdges].sort());
  const baseIds = Object.keys(dataNodes).filter((id) => dataNodes[id].base);
  const drawnBases = measured.links.filter((l) => l.kind === "base").map((l) => l.from);
  expect(drawnBases.sort()).toEqual(baseIds.sort());

  for (const link of measured.links) {
    const a = toScreen(dataPoint(link.from));
    const b = toScreen(link.kind === "base" ? anchorPoint(link.from) : dataPoint(link.to));
    const [ea, eb] = link.ends;
    // Either drawing direction is fine.
    if (!((near(ea, a) && near(eb, b)) || (near(ea, b) && near(eb, a)))) {
      off.push(`${link.kind} link ${link.from}-${link.to}: drawn ${fmt(ea)} → ${fmt(eb)}, data says ${fmt(a)} → ${fmt(b)}`);
    }
  }

  expect(off, off.slice(0, 20).join("\n")).toEqual([]);
});
