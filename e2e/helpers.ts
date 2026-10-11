import { expect, type Locator, type Page } from "@playwright/test";

import skillData from "../src/constants/gameSkillData.json";

// Tree facts the tests rely on, read from the generated data so a game import
// that changes them fails loudly here instead of producing a confusing click.
type RawNode = { type: string; base?: boolean };
type RawType = { maxLevel?: number; cost?: number };
const nodes = skillData.nodes as Record<string, RawNode>;
const types = skillData.types as Record<string, RawType>;

export const adjacency: Record<string, string[]> = {};
for (const [a, b] of skillData.edges as [string, string][]) {
  (adjacency[a] ??= []).push(b);
  (adjacency[b] ??= []).push(a);
}

export const maxLevelOf = (id: string) => types[nodes[id].type].maxLevel ?? 1;
export const isBase = (id: string) => !!nodes[id].base;
export const typeOf = (id: string) => nodes[id].type;
export const nodeIds = Object.keys(nodes);

/** A base node with a single level and a non-base neighbor. */
export const SINGLE_BASE = "17";
/** A base node with several levels. */
export const MULTI_BASE = "2";
/** A non-base neighbor of MULTI_BASE that is only reachable through it. */
export const MULTI_BASE_CHILD = "1";

export function checkFixtureAssumptions() {
  expect(isBase(SINGLE_BASE)).toBe(true);
  expect(maxLevelOf(SINGLE_BASE)).toBe(1);
  expect(adjacency[SINGLE_BASE].some((n) => !isBase(n))).toBe(true);
  expect(isBase(MULTI_BASE)).toBe(true);
  expect(maxLevelOf(MULTI_BASE)).toBeGreaterThan(1);
  expect(isBase(MULTI_BASE_CHILD)).toBe(false);
  expect(adjacency[MULTI_BASE]).toContain(MULTI_BASE_CHILD);
}

export const nonBaseNeighbor = (id: string) => adjacency[id].find((n) => !isBase(n))!;

export const node = (page: Page, id: string): Locator => page.locator(`[data-node-id="${id}"]`);
export const tooltip = (page: Page, id: string): Locator => page.locator(`[data-skill-tooltip="${id}"]`);
export const hud = (page: Page, name: string): Locator => page.locator(`[data-hud="${name}"]:visible`);
export const dialog = (page: Page, name: string): Locator => page.locator(`[data-dialog="${name}"]`);

/** Open the planner and wait until the tree is laid out and centered. */
export async function openPlanner(page: Page, path = "/") {
  await page.goto(path);
  await expect(node(page, SINGLE_BASE)).toBeVisible();
  await waitForStableLayout(page);
  await waitForNodeImages(page);
}

/**
 * Wait for the node art on screen to load. Until an image loads, a node's
 * clickable area can collapse, and a click then misses it.
 */
export async function waitForNodeImages(page: Page) {
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll<HTMLImageElement>("[data-node-id] img")).every((img) => {
      const r = img.getBoundingClientRect();
      const onScreen = r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight;
      return !onScreen || img.complete;
    }),
  );
}

/** Wait until node screen positions stop moving (pan/zoom animations done). */
export async function waitForStableLayout(page: Page, probe = SINGLE_BASE) {
  let last = "";
  await expect
    .poll(
      async () => {
        const c = await center(node(page, probe));
        const key = `${c.x.toFixed(2)},${c.y.toFixed(2)}`;
        const stable = key === last;
        last = key;
        return stable;
      },
      { intervals: [150], timeout: 10_000 },
    )
    .toBe(true);
}

export async function center(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("element has no box");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Screen distance between two nodes: a renderer-agnostic measure of zoom. */
export async function nodeDistance(page: Page, a: string, b: string) {
  const [ca, cb] = await Promise.all([center(node(page, a)), center(node(page, b))]);
  return Math.hypot(ca.x - cb.x, ca.y - cb.y);
}

export async function expectLevel(page: Page, id: string, level: number) {
  const el = node(page, id);
  await expect(el).toHaveAttribute("data-level", String(level));
  await expect(el).toHaveAttribute("data-selected", level > 0 ? "true" : "false");
}

/** Selected node ids and levels as the tree shows them. */
export async function selectedLevels(page: Page) {
  return page.locator('[data-node-id][data-selected="true"]').evaluateAll((els) =>
    Object.fromEntries(els.map((el) => [el.getAttribute("data-node-id")!, Number(el.getAttribute("data-level"))])),
  );
}

/** Same encoding the site uses for ?code= links. */
export const encodeBuild = (build: object) => Buffer.from(JSON.stringify(build), "latin1").toString("base64");
