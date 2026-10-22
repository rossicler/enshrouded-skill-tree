import { expect, test } from "./fixtures";

import { action, card, cardBackground, inCard, levelsIn, openDemo, SAMPLE_BUILD, waitForStableCard } from "./cards";
import {
  MULTI_BASE,
  MULTI_BASE_CHILD,
  SINGLE_BASE,
  anyTooltip,
  center,
  dialog,
  emptyTreePoint,
  expectLevel,
  hud,
  node,
  openPlanner,
  tooltip,
  waitForStableLayout,
} from "./helpers";

// When the skill tooltip opens and closes, with a mouse. The touch cases are
// in tooltip-mobile.spec.ts.

// DOUBLE_JUMP has a single node in the tree.
const SEARCH_TARGET = "12";

test.describe("planner", () => {
  test.beforeEach(async ({ page }) => {
    await openPlanner(page);
  });

  test("a tooltip opened from search closes on a click on empty space", async ({ page }) => {
    await hud(page, "search-input").fill("double ju");
    await expect(page.locator('[data-search-result="DOUBLE_JUMP"]')).toBeVisible();
    await hud(page, "search-input").press("Enter");
    await waitForStableLayout(page, SEARCH_TARGET);
    await expect(tooltip(page, SEARCH_TARGET)).toBeVisible();

    // Straight to the point, without crossing a node on the way.
    const empty = await emptyTreePoint(page);
    await page.mouse.move(empty.x, empty.y);
    await page.mouse.click(empty.x, empty.y);
    await expect(anyTooltip(page)).toHaveCount(0);
  });

  test("a tooltip opened from search stays open under a resting mouse", async ({ page }) => {
    // Seen on Linux CI. The tree zooms under a resting mouse and the tooltip
    // appears under it: the boundary events that sends are not the user
    // hovering or leaving.
    const input = hud(page, "search-input");
    const pick = async () => {
      await input.fill("");
      await input.fill("double ju");
      await expect(page.locator('[data-search-result="DOUBLE_JUMP"]')).toBeVisible();
      await input.press("Enter");
      await waitForStableLayout(page, SEARCH_TARGET);
      await expect(tooltip(page, SEARCH_TARGET)).toBeVisible();
    };
    await pick();
    const box = (await tooltip(page, SEARCH_TARGET).boundingBox())!;
    await page.keyboard.press("Escape");
    await expect(anyTooltip(page)).toHaveCount(0);
    await hud(page, "recenter").click();
    await waitForStableLayout(page);
    // Off any node, so the mouse itself opens nothing.
    const rest = await emptyTreePoint(page, box, 10);
    await page.mouse.move(rest.x, rest.y);
    await pick();
    await page.waitForTimeout(500);
    await expect(tooltip(page, SEARCH_TARGET)).toBeVisible();
    await expect(anyTooltip(page)).toHaveCount(1);
  });

  test("a tooltip closes on a click on empty space after one of its buttons", async ({ page }) => {
    await node(page, MULTI_BASE).hover();
    const tip = tooltip(page, MULTI_BASE);
    await expect(tip).toBeVisible();
    await tip.locator('[data-action="unlock"]').click();
    await expectLevel(page, MULTI_BASE, 1);
    // The card stays open with the new buttons.
    await expect(tip.locator('[data-action="level-up"]')).toBeVisible();

    const empty = await emptyTreePoint(page);
    await page.mouse.move(empty.x, empty.y);
    await page.mouse.click(empty.x, empty.y);
    await expect(anyTooltip(page)).toHaveCount(0);
  });

  test("hover still opens after a delay, closes on leaving, and switches between nodes", async ({ page }) => {
    await node(page, MULTI_BASE).hover();
    // The 500 ms hover delay.
    await page.waitForTimeout(250);
    await expect(anyTooltip(page)).toHaveCount(0);
    await expect(tooltip(page, MULTI_BASE)).toBeVisible();

    await node(page, SINGLE_BASE).hover();
    await expect(tooltip(page, SINGLE_BASE)).toBeVisible();
    await expect(anyTooltip(page)).toHaveCount(1);

    const empty = await emptyTreePoint(page);
    await page.mouse.move(empty.x, empty.y);
    await expect(anyTooltip(page)).toHaveCount(0);
  });

  test("clicking the node keeps its tooltip open with the new level", async ({ page }) => {
    await node(page, MULTI_BASE).hover();
    const tip = tooltip(page, MULTI_BASE);
    await expect(tip).toBeVisible();
    await node(page, MULTI_BASE).click();
    await expectLevel(page, MULTI_BASE, 1);
    await expect(tip).toBeVisible();
    await expect(tip.locator('[data-action="level-up"]')).toBeVisible();
  });

  test("a refund that needs confirming closes the tooltip before the dialog", async ({ page }) => {
    await node(page, MULTI_BASE).click();
    await node(page, MULTI_BASE_CHILD).click();
    await expectLevel(page, MULTI_BASE_CHILD, 1);
    await node(page, MULTI_BASE).hover();
    await tooltip(page, MULTI_BASE).locator('[data-action="refund-one"]').click();
    await expect(dialog(page, "refund-confirm")).toBeVisible();
    await expect(anyTooltip(page)).toHaveCount(0);
  });
  test("Escape closes the tooltip", async ({ page }) => {
    await node(page, MULTI_BASE).hover();
    await expect(tooltip(page, MULTI_BASE)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(anyTooltip(page)).toHaveCount(0);
  });

  test("the close button closes the tooltip", async ({ page }) => {
    await node(page, MULTI_BASE).hover();
    const tip = tooltip(page, MULTI_BASE);
    await expect(tip).toBeVisible();
    const close = tip.locator("[data-tooltip-close]");
    await expect(close).toHaveAccessibleName("Close");
    const box = (await close.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    await close.click();
    await expect(tip).toHaveCount(0);
    await expectLevel(page, MULTI_BASE, 0);
  });

  test("a click elsewhere on the page closes the tooltip", async ({ page }) => {
    await node(page, MULTI_BASE).hover();
    await expect(tooltip(page, MULTI_BASE)).toBeVisible();
    // Off the tree, and clear of the tooltip.
    await hud(page, "recenter").click();
    await expect(anyTooltip(page)).toHaveCount(0);
  });

  test("dragging the tree from the node closes the tooltip, and so does the wheel", async ({ page }) => {
    await node(page, MULTI_BASE).hover();
    await expect(tooltip(page, MULTI_BASE)).toBeVisible();
    const start = await center(node(page, MULTI_BASE));
    await page.mouse.down();
    await page.mouse.move(start.x + 60, start.y + 40, { steps: 6 });
    await page.mouse.up();
    await expect(anyTooltip(page)).toHaveCount(0);

    await waitForStableLayout(page);
    // The drag ended on the node: leave it, then hover it again.
    const empty = await emptyTreePoint(page);
    await page.mouse.move(empty.x, empty.y);
    await node(page, MULTI_BASE).hover();
    await expect(tooltip(page, MULTI_BASE)).toBeVisible();
    await page.mouse.wheel(0, -100);
    await expect(anyTooltip(page)).toHaveCount(0);
  });

  test("the French tooltip labels its close button", async ({ page }) => {
    await openPlanner(page, "/fr");
    await node(page, MULTI_BASE).hover();
    await expect(tooltip(page, MULTI_BASE).locator("[data-tooltip-close]")).toHaveAccessibleName("Fermer");
  });
});

test.describe("cards", () => {
  test.beforeEach(async ({ page }) => {
    await openDemo(page);
  });

  test("closing one card's tooltip leaves the other card alone", async ({ page }) => {
    const a = card(page, "a");
    const b = card(page, "b");
    await inCard(a, MULTI_BASE).hover();
    const tipA = a.locator(`[data-skill-tooltip="${MULTI_BASE}"]`);
    await expect(tipA).toBeVisible();
    await tipA.locator('[data-action="unlock"]').click();
    await expect(inCard(a, MULTI_BASE)).toHaveAttribute("data-level", "1");
    await expect(tipA).toBeVisible();
    // Nothing opened in the other card, and its build is unchanged.
    await expect(b.locator("[data-skill-tooltip]")).toHaveCount(0);
    expect(await levelsIn(b)).toEqual(SAMPLE_BUILD);

    const bg = await cardBackground(a);
    await page.mouse.move(bg.x, bg.y);
    await page.mouse.click(bg.x, bg.y);
    await expect(anyTooltip(page)).toHaveCount(0);

    // Open in B, then Escape: only B had one open, and A stays usable.
    await inCard(b, SINGLE_BASE).hover();
    await expect(b.locator(`[data-skill-tooltip="${SINGLE_BASE}"]`)).toBeVisible();
    await expect(a.locator("[data-skill-tooltip]")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(anyTooltip(page)).toHaveCount(0);
    await inCard(a, SINGLE_BASE).hover();
    await expect(a.locator(`[data-skill-tooltip="${SINGLE_BASE}"]`)).toBeVisible();
    await expect(b.locator("[data-skill-tooltip]")).toHaveCount(0);
  });

  test("a card's tooltip closes with its close button in fullscreen", async ({ page }) => {
    const a = card(page, "a");
    await action(a, "fullscreen").click();
    await expect(a).toHaveAttribute("data-card-mode", "fullscreen");
    await waitForStableCard(a);
    await inCard(a, MULTI_BASE).hover();
    const tip = a.locator(`[data-skill-tooltip="${MULTI_BASE}"]`);
    await expect(tip).toBeVisible();
    await tip.locator("[data-tooltip-close]").click();
    await expect(tip).toHaveCount(0);
    await expect(a).toHaveAttribute("data-card-mode", "fullscreen");
  });
});
