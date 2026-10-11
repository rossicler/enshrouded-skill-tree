import { expect, test } from "./fixtures";

import { MULTI_BASE, SINGLE_BASE, center, hud, node, nodeDistance, openPlanner, waitForStableLayout } from "./helpers";

// Zoom is measured as the screen distance between two nodes and pan as a
// node's screen position, so these tests don't depend on how the tree renders.
const A = SINGLE_BASE;
const B = MULTI_BASE;

test.beforeEach(async ({ page }) => {
  await openPlanner(page);
});

test("the wheel zooms in and out around the pointer", async ({ page }) => {
  const viewport = page.viewportSize()!;
  const start = await nodeDistance(page, A, B);

  await page.mouse.move(viewport.width / 2, viewport.height / 2);
  await page.mouse.wheel(0, -300);
  await waitForStableLayout(page);
  const zoomed = await nodeDistance(page, A, B);
  expect(zoomed).toBeGreaterThan(start * 1.1);

  await page.mouse.wheel(0, 300);
  await waitForStableLayout(page);
  expect(await nodeDistance(page, A, B)).toBeLessThan(zoomed);
});

test("the tree does not zoom out past the initial scale", async ({ page }) => {
  const viewport = page.viewportSize()!;
  const start = await nodeDistance(page, A, B);
  await page.mouse.move(viewport.width / 2, viewport.height / 2);
  await page.mouse.wheel(0, 600);
  await waitForStableLayout(page);
  expect(await nodeDistance(page, A, B)).toBeCloseTo(start, 0);
});

test("dragging the background pans the tree", async ({ page }) => {
  const before = await center(node(page, A));
  await page.mouse.move(200, 400);
  await page.mouse.down();
  await page.mouse.move(260, 440, { steps: 8 });
  await page.mouse.move(320, 480, { steps: 8 });
  await page.mouse.up();
  await waitForStableLayout(page);
  const after = await center(node(page, A));
  expect(after.x - before.x).toBeGreaterThan(60);
  expect(after.y - before.y).toBeGreaterThan(40);
  // A drag is not a click: nothing got selected.
  await expect(page.locator('[data-node-id][data-selected="true"]')).toHaveCount(0);
});

test("the zoom buttons zoom, and recenter restores the initial view", async ({ page }) => {
  const startDistance = await nodeDistance(page, A, B);
  const startPos = await center(node(page, A));

  await hud(page, "zoom-in").click();
  await waitForStableLayout(page);
  const zoomed = await nodeDistance(page, A, B);
  expect(zoomed).toBeGreaterThan(startDistance * 1.2);

  await hud(page, "zoom-in").click();
  await waitForStableLayout(page);
  const zoomedTwice = await nodeDistance(page, A, B);
  expect(zoomedTwice).toBeGreaterThan(zoomed * 1.1);
  await hud(page, "zoom-out").click();
  await waitForStableLayout(page);
  expect(await nodeDistance(page, A, B)).toBeLessThan(zoomedTwice / 1.1);

  // Pan away, then recenter.
  await page.mouse.move(200, 400);
  await page.mouse.down();
  await page.mouse.move(300, 300, { steps: 10 });
  await page.mouse.up();
  await waitForStableLayout(page);

  await hud(page, "recenter").click();
  await waitForStableLayout(page);
  expect(await nodeDistance(page, A, B)).toBeCloseTo(startDistance, 0);
  const pos = await center(node(page, A));
  expect(Math.abs(pos.x - startPos.x)).toBeLessThan(1);
  expect(Math.abs(pos.y - startPos.y)).toBeLessThan(1);
});
