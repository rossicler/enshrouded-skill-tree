import { expect, test } from "./fixtures";

import { center, hud, node, nodeDistance, openPlanner, typeOf, waitForStableLayout } from "./helpers";

// DOUBLE_JUMP has a single node in the tree.
const TARGET = "12";

test("search highlights matching nodes and a result zooms to its node", async ({ page }) => {
  expect(typeOf(TARGET)).toBe("DOUBLE_JUMP");
  await openPlanner(page);
  const startDistance = await nodeDistance(page, "17", "2");

  await expect(page.locator('[data-node-id][data-searched="true"]')).toHaveCount(0);
  await hud(page, "search-input").fill("double ju");
  await expect(node(page, TARGET)).toHaveAttribute("data-searched", "true");
  const result = page.locator('[data-search-result="DOUBLE_JUMP"]');
  await expect(result).toBeVisible();
  await expect(result).toContainText("Double Jump");

  await result.click();
  await waitForStableLayout(page, TARGET);
  expect(await nodeDistance(page, "17", "2")).toBeGreaterThan(startDistance * 2);
  const viewport = page.viewportSize()!;
  const c = await center(node(page, TARGET));
  expect(Math.abs(c.x - viewport.width / 2)).toBeLessThan(5);
  expect(Math.abs(c.y - viewport.height / 2)).toBeLessThan(5);
});

test("Enter picks the highlighted result", async ({ page }) => {
  await openPlanner(page);
  await hud(page, "search-input").fill("double ju");
  await expect(page.locator('[data-search-result="DOUBLE_JUMP"]')).toBeVisible();
  await hud(page, "search-input").press("Enter");
  await expect(page.locator("[data-search-result]")).toHaveCount(0);
  await waitForStableLayout(page, TARGET);
  const viewport = page.viewportSize()!;
  const c = await center(node(page, TARGET));
  expect(Math.abs(c.x - viewport.width / 2)).toBeLessThan(5);
  expect(Math.abs(c.y - viewport.height / 2)).toBeLessThan(5);
});

test("clearing the search removes the highlight", async ({ page }) => {
  await openPlanner(page);
  await hud(page, "search-input").fill("double ju");
  await expect(node(page, TARGET)).toHaveAttribute("data-searched", "true");
  await hud(page, "search-input").fill("");
  await expect(page.locator('[data-node-id][data-searched="true"]')).toHaveCount(0);
});

test("?focus= zooms to the node and searches for it", async ({ page }) => {
  await page.goto(`/?focus=${TARGET}`);
  await expect(node(page, TARGET)).toBeVisible();
  await waitForStableLayout(page, TARGET);
  await expect(hud(page, "search-input")).toHaveValue("Double Jump");
  await expect(node(page, TARGET)).toHaveAttribute("data-searched", "true");
  // Only the exact name matches.
  await expect(page.locator('[data-node-id][data-searched="true"]')).toHaveCount(1);
  const viewport = page.viewportSize()!;
  const c = await center(node(page, TARGET));
  expect(Math.abs(c.x - viewport.width / 2)).toBeLessThan(5);
  expect(Math.abs(c.y - viewport.height / 2)).toBeLessThan(5);
});
