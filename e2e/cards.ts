import { expect, type Locator, type Page } from "@playwright/test";

import { center } from "./helpers";

// Helpers for the card demo page (/card-demo). Each demo card is wrapped in
// [data-demo-card="<id>"]; the expanded overlay is rendered at the end of
// <body> as [data-skill-tree-card-overlay].

export const DEMO_PATH = "/card-demo";

// The demo's sample build for card B and the read-only cards.
export const SAMPLE_BUILD = { "1": 1, "2": 3, "17": 1 };

export const card = (page: Page, id: string): Locator => page.locator(`[data-demo-card="${id}"] [data-skill-tree-card]`);
export const overlay = (page: Page): Locator => page.locator("[data-skill-tree-card-overlay]");
export const scroller = (page: Page): Locator => page.locator("[data-demo-scroller]");
export const inCard = (scope: Locator, nodeId: string): Locator => scope.locator(`[data-node-id="${nodeId}"]`);
export const action = (scope: Locator, name: string): Locator => scope.locator(`[data-card-action="${name}"]`);

export async function openDemo(page: Page) {
  await page.goto(DEMO_PATH);
  await expect(inCard(card(page, "a"), "17")).toBeAttached();
  await waitForStableCard(card(page, "a"));
}

/** Selected node ids and levels in one card (or the overlay). */
export const levelsIn = (scope: Locator) =>
  scope
    .locator('[data-node-id][data-selected="true"]')
    .evaluateAll((els) => Object.fromEntries(els.map((el) => [el.getAttribute("data-node-id")!, Number(el.getAttribute("data-level"))])));

export const scrollTop = (page: Page) => scroller(page).evaluate((el) => el.scrollTop);

/** Which demo card has focus ("" for none), and whether it is the card element itself. */
export const focusedCard = (page: Page) =>
  page.evaluate(() => {
    const active = document.activeElement;
    const id = active?.closest("[data-demo-card]")?.getAttribute("data-demo-card") ?? "";
    return { id, onCard: !!active?.hasAttribute("data-skill-tree-card") };
  });

/** Screen distance between two nodes of a card: its zoom. */
export async function distanceIn(scope: Locator, a: string, b: string) {
  const [ca, cb] = await Promise.all([center(inCard(scope, a)), center(inCard(scope, b))]);
  return Math.hypot(ca.x - cb.x, ca.y - cb.y);
}

/** Wait until a card's nodes stop moving (zoom and pan animations done). */
export async function waitForStableCard(scope: Locator, probe = "17") {
  let last = "";
  await expect
    .poll(
      async () => {
        const c = await center(inCard(scope, probe));
        const key = `${c.x.toFixed(2)},${c.y.toFixed(2)}`;
        const stable = key === last;
        last = key;
        return stable;
      },
      { intervals: [150], timeout: 10_000 },
    )
    .toBe(true);
}

/** Bounding box of every node drawn in a card. */
export const nodesBox = (scope: Locator) =>
  scope.locator("[data-node-id]").evaluateAll((els) => {
    const rects = els.map((el) => el.getBoundingClientRect());
    return {
      left: Math.min(...rects.map((r) => r.left)),
      top: Math.min(...rects.map((r) => r.top)),
      right: Math.max(...rects.map((r) => r.right)),
      bottom: Math.max(...rects.map((r) => r.bottom)),
    };
  });

/** A point on the card's background, clear of nodes and buttons. */
export async function cardBackground(scope: Locator) {
  const box = (await scope.boundingBox())!;
  return { x: box.x + 6, y: box.y + box.height - 6 };
}
