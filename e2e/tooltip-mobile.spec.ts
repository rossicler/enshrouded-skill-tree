import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

import { card, cardBackground, inCard, levelsIn, openDemo, SAMPLE_BUILD } from "./cards";
import { MULTI_BASE, SINGLE_BASE, anyTooltip, center, emptyTreePoint, expectLevel, hud, node, openPlanner, tooltip, waitForStableLayout } from "./helpers";

// When the skill tooltip opens and closes on a touch screen. Runs in the
// "mobile" project (touch, coarse pointer).

// DOUBLE_JUMP has a single node in the tree.
const SEARCH_TARGET = "12";

type Point = { x: number; y: number };

async function touchDrag(page: Page, from: Point, to: Point, steps = 10) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...from, id: 1 }] });
  for (let i = 1; i <= steps; i++) {
    const x = from.x + ((to.x - from.x) * i) / steps;
    const y = from.y + ((to.y - from.y) * i) / steps;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y, id: 1 }] });
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}

const tap = (page: Page, { x, y }: Point) => page.touchscreen.tap(x, y);

test.describe("planner", () => {
  test.beforeEach(async ({ page }) => {
    await openPlanner(page);
  });

  test("after a tooltip button, a tap on empty space closes the tooltip", async ({ page }) => {
    await node(page, MULTI_BASE).tap();
    const tip = tooltip(page, MULTI_BASE);
    await expect(tip).toBeVisible();
    await tip.locator('[data-action="unlock"]').tap();
    await expectLevel(page, MULTI_BASE, 1);
    // The card stays open with the new buttons.
    await expect(tip.locator('[data-action="level-up"]')).toBeVisible();

    await tap(page, await emptyTreePoint(page));
    await expect(anyTooltip(page)).toHaveCount(0);

    // Another node's tooltip closes too.
    await node(page, SINGLE_BASE).tap();
    await expect(tooltip(page, SINGLE_BASE)).toBeVisible();
    await tap(page, await emptyTreePoint(page));
    await expect(anyTooltip(page)).toHaveCount(0);
  });

  test("a tooltip opened from search closes on a tap on empty space", async ({ page }) => {
    await hud(page, "search-input").fill("double ju");
    const result = page.locator('[data-search-result="DOUBLE_JUMP"]');
    await expect(result).toBeVisible();
    await result.tap();
    await waitForStableLayout(page, SEARCH_TARGET);
    await expect(tooltip(page, SEARCH_TARGET)).toBeVisible();

    await tap(page, await emptyTreePoint(page));
    await expect(anyTooltip(page)).toHaveCount(0);
  });

  test("tapping another node switches the tooltip", async ({ page }) => {
    await node(page, MULTI_BASE).tap();
    await expect(tooltip(page, MULTI_BASE)).toBeVisible();
    await node(page, SINGLE_BASE).tap();
    await expect(tooltip(page, SINGLE_BASE)).toBeVisible();
    await expect(anyTooltip(page)).toHaveCount(1);
  });

  test("the close button closes the tooltip and is large enough to tap", async ({ page }) => {
    await node(page, MULTI_BASE).tap();
    const tip = tooltip(page, MULTI_BASE);
    await expect(tip).toBeVisible();
    const close = tip.locator("[data-tooltip-close]");
    const box = (await close.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    await close.tap();
    await expect(anyTooltip(page)).toHaveCount(0);
    await expectLevel(page, MULTI_BASE, 0);
  });

  test("panning the tree from the node closes the tooltip", async ({ page }) => {
    await node(page, MULTI_BASE).tap();
    await expect(tooltip(page, MULTI_BASE)).toBeVisible();
    const from = await center(node(page, MULTI_BASE));
    await touchDrag(page, from, { x: from.x + 50, y: from.y + 60 });
    await expect(anyTooltip(page)).toHaveCount(0);
    await expectLevel(page, MULTI_BASE, 0);
  });
});

test.describe("cards", () => {
  test.beforeEach(async ({ page }) => {
    await openDemo(page);
  });

  test("after a button in one card's tooltip, a tap on the card closes it and the other card is untouched", async ({ page }) => {
    const a = card(page, "a");
    const b = card(page, "b");
    await inCard(a, MULTI_BASE).tap();
    const tip = a.locator(`[data-skill-tooltip="${MULTI_BASE}"]`);
    await expect(tip).toBeVisible();
    await tip.locator('[data-action="unlock"]').tap();
    await expect(inCard(a, MULTI_BASE)).toHaveAttribute("data-level", "1");
    await expect(tip.locator('[data-action="level-up"]')).toBeVisible();
    await expect(b.locator("[data-skill-tooltip]")).toHaveCount(0);

    await tap(page, await cardBackground(a));
    await expect(anyTooltip(page)).toHaveCount(0);
    expect(await levelsIn(a)).toEqual({ [MULTI_BASE]: 1 });
    expect(await levelsIn(b)).toEqual(SAMPLE_BUILD);
  });
});
