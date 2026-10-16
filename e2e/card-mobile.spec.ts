import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

import { action, card, focusedCard, inCard, levelsIn, openDemo, overlay, scrollTop, waitForStableCard } from "./cards";
import { MULTI_BASE, center } from "./helpers";

// The skill tree card on a touch screen. Runs in the "mobile" project
// (touch, coarse pointer).

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

async function longPress(page: Page, at: Point, holdMs: number) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...at, id: 1 }] });
  await page.waitForTimeout(holdMs);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}

test.beforeEach(async ({ page }) => {
  await openDemo(page);
});

test("double tap unlocks and long press refunds in a card", async ({ page }) => {
  const a = card(page, "a");
  const target = inCard(a, MULTI_BASE);
  await target.tap();
  await page.waitForTimeout(400);
  expect(await levelsIn(a)).toEqual({});

  await target.tap();
  await target.tap();
  await expect(target).toHaveAttribute("data-level", "1");
  await page.waitForTimeout(400);
  await target.tap();
  await target.tap();
  await expect(target).toHaveAttribute("data-level", "2");
  await page.waitForTimeout(400);

  await longPress(page, await center(target), 800);
  await expect(target).toHaveAttribute("data-level", "1");
  expect(await levelsIn(card(page, "b"))).toEqual({ "1": 1, "2": 3, "17": 1 });
});

test("a touch drag pans the card, not the page; outside the card the page scrolls", async ({ page }) => {
  const a = card(page, "a");
  await action(a, "zoom-in").tap();
  await action(a, "zoom-in").tap();
  await waitForStableCard(a);
  const before = await center(inCard(a, MULTI_BASE));
  const box = (await a.boundingBox())!;
  await touchDrag(page, { x: box.x + 60, y: box.y + box.height - 60 }, { x: box.x + 110, y: box.y + box.height - 120 });
  await waitForStableCard(a);
  const after = await center(inCard(a, MULTI_BASE));
  expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeGreaterThan(20);
  expect(await scrollTop(page)).toBe(0);

  // The page's own text, above the cards.
  const heading = (await page.locator("h1").boundingBox())!;
  await touchDrag(page, { x: heading.x + 20, y: heading.y + 200 }, { x: heading.x + 20, y: heading.y + 20 });
  await expect.poll(() => scrollTop(page)).toBeGreaterThan(0);
});

test("expand works on a touch screen and returns to the card", async ({ page }) => {
  const a = card(page, "a");
  const target = inCard(a, MULTI_BASE);
  await target.tap();
  await target.tap();
  await expect(target).toHaveAttribute("data-level", "1");

  await action(a, "expand").tap();
  const o = overlay(page);
  await expect(o).toBeVisible();
  await waitForStableCard(o);
  expect(await levelsIn(o)).toEqual({ [MULTI_BASE]: 1 });
  const viewport = page.viewportSize()!;
  const panel = (await o.locator('[role="dialog"]').boundingBox())!;
  expect(panel.width).toBeLessThanOrEqual(viewport.width);
  expect(panel.width).toBeGreaterThan(viewport.width * 0.85);

  await action(o, "close").tap();
  await expect(o).toHaveCount(0);
  expect(await focusedCard(page)).toEqual({ id: "a", onCard: true });
});

test("a 280 px card fits a phone screen", async ({ page }) => {
  const c = card(page, "s280");
  await c.scrollIntoViewIfNeeded();
  const box = (await c.boundingBox())!;
  expect(box.width).toBeCloseTo(280, 0);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width);
});
