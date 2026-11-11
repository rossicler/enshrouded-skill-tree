import { expect, test } from "./fixtures";

import {
  SAMPLE_BUILD,
  action,
  card,
  cardBackground,
  distanceIn,
  focusedCard,
  inCard,
  levelsIn,
  nodesBox,
  openDemo,
  overlay,
  scrollTop,
  waitForStableCard,
} from "./cards";
import { MULTI_BASE, MULTI_BASE_CHILD, SINGLE_BASE, center, checkFixtureAssumptions, nonBaseNeighbor } from "./helpers";

// The skill tree card (@enshrouded/react SkillTreeCard) on the demo page.

test.beforeAll(() => checkFixtureAssumptions());

test.beforeEach(async ({ page }) => {
  await openDemo(page);
});

test("two editable cards on one page stay independent", async ({ page }) => {
  const a = card(page, "a");
  const b = card(page, "b");
  expect(await levelsIn(a)).toEqual({});
  expect(await levelsIn(b)).toEqual(SAMPLE_BUILD);

  await inCard(a, SINGLE_BASE).click();
  await expect(inCard(a, SINGLE_BASE)).toHaveAttribute("data-level", "1");
  expect(await levelsIn(b)).toEqual(SAMPLE_BUILD);
  expect(await levelsIn(card(page, "s360"))).toEqual({});

  await inCard(b, MULTI_BASE_CHILD).click({ button: "right" });
  await expect(inCard(b, MULTI_BASE_CHILD)).toHaveAttribute("data-selected", "false");
  expect(await levelsIn(a)).toEqual({ [SINGLE_BASE]: 1 });

  // One tooltip at a time, inside the hovered card.
  await inCard(a, MULTI_BASE).hover();
  await expect(a.locator(`[data-skill-tooltip="${MULTI_BASE}"]`)).toBeVisible();
  await expect(page.locator("[data-skill-tooltip]:visible")).toHaveCount(1);
  await inCard(b, MULTI_BASE).hover();
  await expect(b.locator(`[data-skill-tooltip="${MULTI_BASE}"]`)).toBeVisible();
  await expect(a.locator("[data-skill-tooltip]")).toHaveCount(0);

  // Zooming one card leaves the other alone.
  const before = await distanceIn(b, SINGLE_BASE, MULTI_BASE);
  await action(a, "zoom-in").click();
  await waitForStableCard(a);
  expect(await distanceIn(b, SINGLE_BASE, MULTI_BASE)).toBeCloseTo(before, 1);
});

test("the wheel scrolls the page until the card has focus", async ({ page }) => {
  const a = card(page, "a");
  const start = await distanceIn(a, SINGLE_BASE, MULTI_BASE);
  const box = (await a.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, 100);
  await expect.poll(() => scrollTop(page)).toBeGreaterThan(0);
  expect(await distanceIn(a, SINGLE_BASE, MULTI_BASE)).toBeCloseTo(start, 1);
  expect((await focusedCard(page)).id).toBe("");

  // Clicking the card focuses it; then the wheel zooms it and the page stays.
  await a.scrollIntoViewIfNeeded();
  const bg = await cardBackground(a);
  await page.mouse.click(bg.x, bg.y);
  expect(await focusedCard(page)).toEqual({ id: "a", onCard: true });
  const scrolled = await scrollTop(page);
  const box2 = (await a.boundingBox())!;
  await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2);
  await page.mouse.wheel(0, -300);
  await waitForStableCard(a);
  expect(await distanceIn(a, SINGLE_BASE, MULTI_BASE)).toBeGreaterThan(start * 1.1);
  expect(await scrollTop(page)).toBe(scrolled);
});

test("one wheel tick zooms a card a little", async ({ page }) => {
  const a = card(page, "a");
  const bg = await cardBackground(a);
  await page.mouse.click(bg.x, bg.y);
  const start = await distanceIn(a, SINGLE_BASE, MULTI_BASE);
  const box = (await a.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, -100);
  await waitForStableCard(a);
  const ratio = (await distanceIn(a, SINGLE_BASE, MULTI_BASE)) / start;
  expect(ratio).toBeGreaterThan(1.1);
  expect(ratio).toBeLessThan(1.25);
  // The fitted view is the most zoomed-out one.
  await page.mouse.wheel(0, 800);
  await waitForStableCard(a);
  expect(await distanceIn(a, SINGLE_BASE, MULTI_BASE)).toBeCloseTo(start, 0);
});

test("Ctrl + wheel zooms a card without focus, and the page stays", async ({ page }) => {
  const b = card(page, "b");
  const start = await distanceIn(b, SINGLE_BASE, MULTI_BASE);
  const box = (await b.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.keyboard.down("Control");
  await page.mouse.wheel(0, -300);
  await page.keyboard.up("Control");
  await waitForStableCard(b);
  expect(await distanceIn(b, SINGLE_BASE, MULTI_BASE)).toBeGreaterThan(start * 1.1);
  expect(await scrollTop(page)).toBe(0);
});

test("dragging inside a card pans it and doesn't scroll the page", async ({ page }) => {
  const a = card(page, "a");
  await action(a, "zoom-in").click();
  await action(a, "zoom-in").click();
  await waitForStableCard(a);
  const before = await center(inCard(a, SINGLE_BASE));
  const box = (await a.boundingBox())!;
  const from = { x: box.x + 40, y: box.y + box.height - 40 };
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 50, from.y - 40, { steps: 8 });
  await page.mouse.up();
  await waitForStableCard(a);
  const after = await center(inCard(a, SINGLE_BASE));
  expect(after.x - before.x).toBeGreaterThan(20);
  expect(after.y - before.y).toBeLessThan(-15);
  expect(await scrollTop(page)).toBe(0);
});

test("expand opens the same build in an overlay and returns to the card", async ({ page }) => {
  const a = card(page, "a");
  await inCard(a, SINGLE_BASE).click();
  await action(a, "expand").click();
  const o = overlay(page);
  await expect(o).toBeVisible();
  await expect(a).toHaveAttribute("data-card-mode", "expanded");
  expect(await levelsIn(o)).toEqual({ [SINGLE_BASE]: 1 });

  // About 90% of the viewport.
  const viewport = page.viewportSize()!;
  const panel = (await o.locator('[role="dialog"]').boundingBox())!;
  expect(panel.width).toBeCloseTo(viewport.width * 0.9, -1);
  expect(panel.height).toBeCloseTo(viewport.height * 0.9, -1);

  // Editing in the overlay edits the card's build.
  const neighbor = nonBaseNeighbor(SINGLE_BASE);
  await waitForStableCard(o);
  await inCard(o, neighbor).click();
  await expect(inCard(o, neighbor)).toHaveAttribute("data-level", "1");

  await page.keyboard.press("Escape");
  await expect(o).toHaveCount(0);
  await expect(a).toHaveAttribute("data-card-mode", "inline");
  expect(await levelsIn(a)).toEqual({ [SINGLE_BASE]: 1, [neighbor]: 1 });
  expect(await focusedCard(page)).toEqual({ id: "a", onCard: true });

  // The close button does the same.
  await action(a, "expand").click();
  await expect(o).toBeVisible();
  await action(o, "close").click();
  await expect(o).toHaveCount(0);
  expect(await focusedCard(page)).toEqual({ id: "a", onCard: true });
});

test("fullscreen shows the card alone with the same build and returns", async ({ page }) => {
  const a = card(page, "a");
  await inCard(a, SINGLE_BASE).click();
  await action(a, "fullscreen").click();
  await expect(a).toHaveAttribute("data-card-mode", "fullscreen");
  expect(await a.evaluate((el) => document.fullscreenElement === el)).toBe(true);
  const viewport = page.viewportSize()!;
  await expect.poll(async () => (await a.boundingBox())?.width).toBeCloseTo(viewport.width, 0);
  await waitForStableCard(a);
  expect(await levelsIn(a)).toEqual({ [SINGLE_BASE]: 1 });

  // Tooltips show inside the fullscreen card, within the screen.
  await inCard(a, MULTI_BASE).hover();
  const tip = a.locator(`[data-skill-tooltip="${MULTI_BASE}"]`);
  await expect(tip).toBeVisible();
  const tipBox = (await tip.boundingBox())!;
  expect(tipBox.x).toBeGreaterThanOrEqual(0);
  expect(tipBox.y).toBeGreaterThanOrEqual(0);
  expect(tipBox.x + tipBox.width).toBeLessThanOrEqual(viewport.width);
  expect(tipBox.y + tipBox.height).toBeLessThanOrEqual(viewport.height);

  await action(a, "exit-fullscreen").click();
  await expect(a).toHaveAttribute("data-card-mode", "inline");
  expect(await page.evaluate(() => document.fullscreenElement)).toBeNull();
  expect(await focusedCard(page)).toEqual({ id: "a", onCard: true });
  await expect.poll(async () => (await a.boundingBox())?.width).toBeCloseTo(360, 0);

  // Leaving fullscreen from outside the card (the browser's Esc) returns too.
  await action(a, "fullscreen").click();
  await expect(a).toHaveAttribute("data-card-mode", "fullscreen");
  await page.evaluate(() => document.exitFullscreen());
  await expect(a).toHaveAttribute("data-card-mode", "inline");
  expect(await focusedCard(page)).toEqual({ id: "a", onCard: true });
  expect(await levelsIn(a)).toEqual({ [SINGLE_BASE]: 1 });
});

test("fullscreen falls back to the overlay without the Fullscreen API", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(Document.prototype, "fullscreenEnabled", { get: () => false }));
  await openDemo(page);
  const a = card(page, "a");
  await action(a, "fullscreen").click();
  await expect(overlay(page)).toBeVisible();
  await expect(a).toHaveAttribute("data-card-mode", "expanded");
  expect(await page.evaluate(() => document.fullscreenElement)).toBeNull();
  await page.keyboard.press("Escape");
  await expect(overlay(page)).toHaveCount(0);
  expect(await focusedCard(page)).toEqual({ id: "a", onCard: true });
});

test("a read-only card ignores clicks but shows tooltips", async ({ page }) => {
  const ro = card(page, "ro");
  await ro.scrollIntoViewIfNeeded();
  await waitForStableCard(ro);
  expect(await levelsIn(ro)).toEqual(SAMPLE_BUILD);
  await expect(ro).toHaveAttribute("data-read-only", "true");

  await inCard(ro, nonBaseNeighbor(SINGLE_BASE)).click();
  await inCard(ro, MULTI_BASE).click({ button: "right" });
  await inCard(ro, MULTI_BASE).click();
  await page.waitForTimeout(300);
  expect(await levelsIn(ro)).toEqual(SAMPLE_BUILD);

  await inCard(ro, MULTI_BASE).hover();
  const tip = ro.locator(`[data-skill-tooltip="${MULTI_BASE}"]`);
  await expect(tip).toBeVisible();
  await expect(tip.locator("[data-action]")).toHaveCount(0);

  // Without a sized container the card takes its default size.
  const box = (await ro.boundingBox())!;
  expect(box.width).toBeCloseTo(360, 0);
  expect(box.height).toBeCloseTo(360, 0);
});

for (const size of [280, 360, 600]) {
  test(`a ${size} px card shows the whole tree and works`, async ({ page }) => {
    const c = card(page, `s${size}`);
    await c.scrollIntoViewIfNeeded();
    await waitForStableCard(c);
    const box = (await c.boundingBox())!;
    expect(box.width).toBeCloseTo(size, 0);
    expect(box.height).toBeCloseTo(size, 0);

    // The whole tree is in the card and fills most of it.
    const nodes = await nodesBox(c);
    expect(nodes.left).toBeGreaterThanOrEqual(box.x);
    expect(nodes.top).toBeGreaterThanOrEqual(box.y);
    expect(nodes.right).toBeLessThanOrEqual(box.x + box.width);
    expect(nodes.bottom).toBeLessThanOrEqual(box.y + box.height);
    expect(Math.max(nodes.right - nodes.left, nodes.bottom - nodes.top)).toBeGreaterThan(size * 0.75);

    // The controls fit inside it.
    for (const name of ["zoom-in", "zoom-out", "fit", "expand", "fullscreen"]) {
      const b = (await action(c, name).boundingBox())!;
      expect(b.y + b.height).toBeLessThanOrEqual(box.y + box.height);
      expect(b.x).toBeGreaterThanOrEqual(box.x);
    }

    // Editing and the tooltip, which stays inside the viewport even though
    // it is larger than a small card.
    await inCard(c, MULTI_BASE).click();
    await expect(inCard(c, MULTI_BASE)).toHaveAttribute("data-level", "1");
    await inCard(c, MULTI_BASE).hover();
    const tip = c.locator(`[data-skill-tooltip="${MULTI_BASE}"]`);
    await expect(tip).toBeVisible();
    const viewport = page.viewportSize()!;
    const tipBox = (await tip.boundingBox())!;
    expect(tipBox.x).toBeGreaterThanOrEqual(0);
    expect(tipBox.x + tipBox.width).toBeLessThanOrEqual(viewport.width);
    expect(tipBox.y).toBeGreaterThanOrEqual(0);
    expect(tipBox.y + tipBox.height).toBeLessThanOrEqual(viewport.height);

    // Zoom buttons, then back to the whole tree.
    const fitted = await distanceIn(c, SINGLE_BASE, MULTI_BASE);
    await action(c, "zoom-in").click();
    await waitForStableCard(c);
    expect(await distanceIn(c, SINGLE_BASE, MULTI_BASE)).toBeGreaterThan(fitted * 1.1);
    await action(c, "fit").click();
    await waitForStableCard(c);
    expect(await distanceIn(c, SINGLE_BASE, MULTI_BASE)).toBeCloseTo(fitted, 0);
  });
}
