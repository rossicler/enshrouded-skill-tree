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

test("one wheel tick zooms a little, not to the limit", async ({ page }) => {
  const viewport = page.viewportSize()!;
  const start = await nodeDistance(page, A, B);
  await page.mouse.move(viewport.width / 2, viewport.height / 2);
  // One notch of a typical mouse wheel. The initial scale is 2 and the max 5,
  // so jumping to the limit would multiply the distance by 2.5.
  await page.mouse.wheel(0, -100);
  await waitForStableLayout(page);
  const ratio = (await nodeDistance(page, A, B)) / start;
  expect(ratio).toBeGreaterThan(1.1);
  expect(ratio).toBeLessThan(1.25);
});

test("six wheel ticks zoom from the initial scale to the max", async ({ page }) => {
  const viewport = page.viewportSize()!;
  const start = await nodeDistance(page, A, B);
  await page.mouse.move(viewport.width / 2, viewport.height / 2);
  // 17% per tick: five ticks stay below the max (2 × 1.17^5 = 4.38), and the
  // sixth passes the max of 5, so the distance grows 2.5×.
  for (let i = 0; i < 5; i++) await page.mouse.wheel(0, -100);
  await waitForStableLayout(page);
  expect((await nodeDistance(page, A, B)) / start).toBeCloseTo(1.17 ** 5, 1);
  await page.mouse.wheel(0, -100);
  await waitForStableLayout(page);
  expect((await nodeDistance(page, A, B)) / start).toBeCloseTo(2.5, 1);
});

test("a fast wheel spin zooms at most two ticks at once", async ({ page }) => {
  const viewport = page.viewportSize()!;
  const start = await nodeDistance(page, A, B);
  await page.mouse.move(viewport.width / 2, viewport.height / 2);
  // Ten notches in one event count as two: 1.17^2, not the max.
  await page.mouse.wheel(0, -1000);
  await waitForStableLayout(page);
  expect((await nodeDistance(page, A, B)) / start).toBeCloseTo(1.17 ** 2, 1);
});

test("a trackpad pinch follows the fingers, and Ctrl + wheel zooms like the wheel", async ({ page }) => {
  const viewport = page.viewportSize()!;
  const start = await nodeDistance(page, A, B);
  await page.mouse.move(viewport.width / 2, viewport.height / 2);
  // Chrome sends a pinch as Ctrl + wheel events of deltaY = 100 × ln(finger
  // scale). Fingers spreading 2× over ten events double the scale.
  await page.keyboard.down("Control");
  for (let i = 0; i < 10; i++) await page.mouse.wheel(0, (-100 * Math.LN2) / 10);
  await waitForStableLayout(page);
  const pinched = await nodeDistance(page, A, B);
  expect(pinched / start).toBeCloseTo(2, 1);
  // One whole notch with Ctrl held is a mouse wheel, not a pinch.
  await page.mouse.wheel(0, 100);
  await page.keyboard.up("Control");
  await waitForStableLayout(page);
  expect(pinched / (await nodeDistance(page, A, B))).toBeCloseTo(1.17, 1);
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
  // At the initial zoom the whole tree fits the desktop viewport, so there is
  // little room to pan; zoom in first.
  await hud(page, "zoom-in").click();
  await hud(page, "zoom-in").click();
  await waitForStableLayout(page);
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

test("panning stops near the edge of the tree", async ({ page }) => {
  const { width, height } = page.viewportSize()!;
  // At the max zoom the tree is far larger than the screen.
  for (let i = 0; i < 8; i++) await hud(page, "zoom-in").click();
  await waitForStableLayout(page);

  const treeBox = () =>
    page.locator("[data-node-id]").evaluateAll((els) => {
      const r = els.map((el) => el.getBoundingClientRect());
      return {
        left: Math.min(...r.map((b) => b.left)),
        right: Math.max(...r.map((b) => b.right)),
        top: Math.min(...r.map((b) => b.top)),
        bottom: Math.max(...r.map((b) => b.bottom)),
      };
    });
  // Several long drags in one direction, from inside the viewport.
  const dragFar = async (dx: number, dy: number) => {
    for (let i = 0; i < 4; i++) {
      const x = width / 2 - dx / 2;
      const y = height / 2 - dy / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + dx, y + dy, { steps: 10 });
      await page.mouse.up();
    }
    await waitForStableLayout(page);
  };

  // Wherever you drag, the tree still covers at least a quarter of the screen.
  await dragFar(width * 0.8, 0);
  expect((await treeBox()).left).toBeLessThan(width * 0.75);
  await dragFar(-width * 0.8, 0);
  expect((await treeBox()).right).toBeGreaterThan(width * 0.25);
  await dragFar(0, height * 0.8);
  expect((await treeBox()).top).toBeLessThan(height * 0.75);
  await dragFar(0, -height * 0.8);
  expect((await treeBox()).bottom).toBeGreaterThan(height * 0.25);
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
