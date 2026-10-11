import type { Locator, Page } from "@playwright/test";

import { expect, test } from "./fixtures";

import { MULTI_BASE, center, expectLevel, node, openPlanner } from "./helpers";

// Runs in the "mobile" project (touch, coarse pointer).

async function touch(page: Page, target: Locator, holdMs: number) {
  const { x, y } = await center(target);
  const cdp = await page.context().newCDPSession(page);
  const point = [{ x, y, id: 1 }];
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: point });
  await page.waitForTimeout(holdMs);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}

test.beforeEach(async ({ page }) => {
  await openPlanner(page);
});

test("a single tap does not unlock a node", async ({ page }) => {
  await node(page, MULTI_BASE).tap();
  await page.waitForTimeout(500);
  await expectLevel(page, MULTI_BASE, 0);
});

test("a double tap unlocks and levels up a node", async ({ page }) => {
  await node(page, MULTI_BASE).tap();
  await node(page, MULTI_BASE).tap();
  await expectLevel(page, MULTI_BASE, 1);
  await page.waitForTimeout(400);
  await node(page, MULTI_BASE).tap();
  await node(page, MULTI_BASE).tap();
  await expectLevel(page, MULTI_BASE, 2);
});

test("a long press refunds one level", async ({ page }) => {
  for (let level = 1; level <= 2; level++) {
    await node(page, MULTI_BASE).tap();
    await node(page, MULTI_BASE).tap();
    await expectLevel(page, MULTI_BASE, level);
    await page.waitForTimeout(400);
  }
  await touch(page, node(page, MULTI_BASE), 800);
  await expectLevel(page, MULTI_BASE, 1);
  // A short touch is not a long press.
  await touch(page, node(page, MULTI_BASE), 100);
  await page.waitForTimeout(600);
  await expectLevel(page, MULTI_BASE, 1);
});
