import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "./fixtures";

import { nodeIds, openPlanner } from "./helpers";

// Screen positions of every node center and link endpoint in the initial view
// at a fixed viewport, so a different renderer can be checked against today's
// layout. Regenerate with UPDATE_POSITIONS=1 (only when a layout change is
// intended, e.g. after a game import moves nodes).
const BASELINE = path.join(__dirname, "baseline", "positions.json");
const TOLERANCE_PX = 1;

type Point = [number, number];
type Positions = {
  viewport: { width: number; height: number };
  nodes: Record<string, Point>;
  links: Record<string, [Point, Point]>;
};

const round = (n: number) => Math.round(n * 100) / 100;

test("node and link positions match the recorded baseline", async ({ page }) => {
  test.skip(test.info().project.name !== "desktop", "baseline is recorded at the desktop viewport");
  await page.setViewportSize({ width: 1280, height: 800 });
  await openPlanner(page);

  const measured: Positions = await page.evaluate(() => {
    const nodes: Record<string, [number, number]> = {};
    document.querySelectorAll<HTMLElement>("[data-node-id]").forEach((el) => {
      const r = el.getBoundingClientRect();
      nodes[el.dataset.nodeId!] = [r.left + r.width / 2, r.top + r.height / 2];
    });
    const links: Record<string, [[number, number], [number, number]]> = {};
    document.querySelectorAll<SVGLineElement>("line[data-link-from]").forEach((line) => {
      const ctm = line.getScreenCTM()!;
      const end = (x: number, y: number): [number, number] => {
        const p = new DOMPoint(x, y).matrixTransform(ctm);
        return [p.x, p.y];
      };
      const key = `${line.dataset.linkFrom}-${line.dataset.linkTo}`;
      links[key] = [
        end(line.x1.baseVal.value, line.y1.baseVal.value),
        end(line.x2.baseVal.value, line.y2.baseVal.value),
      ];
    });
    return { viewport: { width: window.innerWidth, height: window.innerHeight }, nodes, links };
  });

  const rounded: Positions = {
    viewport: measured.viewport,
    nodes: Object.fromEntries(Object.entries(measured.nodes).map(([k, [x, y]]) => [k, [round(x), round(y)]])),
    links: Object.fromEntries(
      Object.entries(measured.links).map(([k, [[x1, y1], [x2, y2]]]) => [
        k,
        [
          [round(x1), round(y1)],
          [round(x2), round(y2)],
        ],
      ]),
    ),
  };

  expect(Object.keys(rounded.nodes).sort()).toEqual([...nodeIds].sort());

  if (process.env.UPDATE_POSITIONS || !existsSync(BASELINE)) {
    await mkdir(path.dirname(BASELINE), { recursive: true });
    await writeFile(BASELINE, JSON.stringify(rounded, null, 1) + "\n");
    test.info().annotations.push({ type: "note", description: `wrote ${BASELINE}` });
    return;
  }

  const baseline: Positions = JSON.parse(await readFile(BASELINE, "utf8"));
  expect(rounded.viewport).toEqual(baseline.viewport);
  expect(Object.keys(rounded.nodes).sort()).toEqual(Object.keys(baseline.nodes).sort());
  expect(Object.keys(rounded.links).sort()).toEqual(Object.keys(baseline.links).sort());

  const off: string[] = [];
  const near = (a: Point, b: Point) => Math.abs(a[0] - b[0]) <= TOLERANCE_PX && Math.abs(a[1] - b[1]) <= TOLERANCE_PX;
  for (const [id, p] of Object.entries(baseline.nodes)) {
    if (!near(rounded.nodes[id], p)) off.push(`node ${id}: ${rounded.nodes[id]} vs ${p}`);
  }
  for (const [id, [a, b]] of Object.entries(baseline.links)) {
    const [ma, mb] = rounded.links[id];
    if (!near(ma, a) || !near(mb, b)) off.push(`link ${id}: ${ma} ${mb} vs ${a} ${b}`);
  }
  expect(off, off.slice(0, 20).join("\n")).toEqual([]);
});
