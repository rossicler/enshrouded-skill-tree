import { expect, test } from "./fixtures";

import {
  MULTI_BASE,
  MULTI_BASE_CHILD,
  SINGLE_BASE,
  checkFixtureAssumptions,
  dialog,
  encodeBuild,
  expectLevel,
  hud,
  maxLevelOf,
  node,
  nonBaseNeighbor,
  openPlanner,
  tooltip,
} from "./helpers";

test.beforeAll(() => checkFixtureAssumptions());

test.beforeEach(async ({ page }) => {
  await openPlanner(page);
});

test("unlocking a base node selects it and makes its neighbors selectable", async ({ page }) => {
  const neighbor = nonBaseNeighbor(SINGLE_BASE);
  await expect(node(page, SINGLE_BASE)).toHaveAttribute("data-state", "selectable");
  await expect(node(page, neighbor)).toHaveAttribute("data-state", "locked");

  await node(page, SINGLE_BASE).click();

  await expectLevel(page, SINGLE_BASE, 1);
  await expect(node(page, SINGLE_BASE)).toHaveAttribute("data-state", "selected");
  await expect(node(page, neighbor)).toHaveAttribute("data-state", "selectable");
  await expect(hud(page, "points-used")).toHaveText("1");
  await expect(
    page.locator(`[data-link-from="${SINGLE_BASE}"][data-link-kind="base"]`),
  ).toHaveAttribute("data-connected", "true");

  await node(page, neighbor).click();
  await expectLevel(page, neighbor, 1);
  await expect(page.locator(`[data-link-kind="edge"][data-connected="true"]`)).toHaveCount(1);
});

test("clicking levels a node up, and clicking at max level wraps to a refund", async ({ page }) => {
  const max = maxLevelOf(MULTI_BASE);
  await expect(node(page, MULTI_BASE)).toHaveAttribute("data-max-level", String(max));
  for (let level = 1; level <= max; level++) {
    await node(page, MULTI_BASE).click();
    await expectLevel(page, MULTI_BASE, level);
  }
  await expect(hud(page, "points-used")).toHaveText(String(max));

  // Alone, nothing else depends on it, so the refund needs no confirmation.
  await node(page, MULTI_BASE).click();
  await expectLevel(page, MULTI_BASE, 0);
  await expect(dialog(page, "refund-confirm")).toHaveCount(0);
  await expect(hud(page, "points-used")).toHaveText("0");
});

test("right-click refunds one level, then the node", async ({ page }) => {
  await node(page, MULTI_BASE).click();
  await node(page, MULTI_BASE).click();
  await expectLevel(page, MULTI_BASE, 2);

  await node(page, MULTI_BASE).click({ button: "right" });
  await expectLevel(page, MULTI_BASE, 1);
  await node(page, MULTI_BASE).click({ button: "right" });
  await expectLevel(page, MULTI_BASE, 0);
  // Nothing left to refund.
  await node(page, MULTI_BASE).click({ button: "right" });
  await expectLevel(page, MULTI_BASE, 0);
});

test("refunding a node that others depend on asks for confirmation", async ({ page }) => {
  await node(page, MULTI_BASE).click();
  await node(page, MULTI_BASE_CHILD).click();
  await expectLevel(page, MULTI_BASE_CHILD, 1);

  // Cancel keeps both.
  await node(page, MULTI_BASE).click({ button: "right" });
  await expect(dialog(page, "refund-confirm")).toBeVisible();
  await dialog(page, "refund-confirm").locator('[data-action="cancel"]').click();
  await expect(dialog(page, "refund-confirm")).toHaveCount(0);
  await expectLevel(page, MULTI_BASE, 1);
  await expectLevel(page, MULTI_BASE_CHILD, 1);

  // Confirm removes the node and everything cut off from a base node.
  await node(page, MULTI_BASE).click({ button: "right" });
  await expect(dialog(page, "refund-confirm")).toBeVisible();
  await dialog(page, "refund-confirm").locator('[data-action="confirm"]').click();
  await expect(dialog(page, "refund-confirm")).toHaveCount(0);
  await expectLevel(page, MULTI_BASE, 0);
  await expectLevel(page, MULTI_BASE_CHILD, 0);
});

test("closing the refund confirmation draws no focus outline on the node", async ({ page }) => {
  // The dialog hands focus back to the node it was opened from; Chrome's
  // default focus outline then drew a box around it.
  await node(page, MULTI_BASE).click();
  await node(page, MULTI_BASE_CHILD).click();
  for (const action of ["cancel", "confirm"]) {
    await node(page, MULTI_BASE).click({ button: "right" });
    await dialog(page, "refund-confirm").locator(`[data-action="${action}"]`).click();
    await expect(dialog(page, "refund-confirm")).toHaveCount(0);
    // Focus moves back a moment after the dialog leaves the page; until then
    // the active element can still be the dialog's own (outlined) button.
    // Wait for focus to settle outside the dialog, then check its outline.
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const el = document.activeElement;
            if (!el || el === document.body) return "none";
            if (!el.isConnected || el.closest('[role="dialog"], [data-dialog]')) return "pending";
            return getComputedStyle(el).outlineStyle;
          }),
        { message: `focus outline after ${action}` },
      )
      .toBe("none");
  }
});

test("wrapping a max-level node that others depend on also asks for confirmation", async ({ page }) => {
  for (let i = 0; i < maxLevelOf(MULTI_BASE); i++) await node(page, MULTI_BASE).click();
  await node(page, MULTI_BASE_CHILD).click();
  await node(page, MULTI_BASE).click();
  await expect(dialog(page, "refund-confirm")).toBeVisible();
  await dialog(page, "refund-confirm").locator('[data-action="confirm"]').click();
  await expectLevel(page, MULTI_BASE, 0);
  await expectLevel(page, MULTI_BASE_CHILD, 0);
});

test("an out-of-range node stays locked and its tooltip flashes", async ({ page }) => {
  const target = nonBaseNeighbor(SINGLE_BASE);
  await node(page, target).hover();
  await expect(tooltip(page, target)).toBeVisible();
  const outOfRange = tooltip(page, target).locator("[data-out-of-range]");
  await expect(outOfRange).toBeVisible();
  await expect(outOfRange).toHaveAttribute("data-flash", "false");

  await node(page, target).click();
  await expect(outOfRange).toHaveAttribute("data-flash", "true");
  await expectLevel(page, target, 0);
  await expect(node(page, target)).toHaveAttribute("data-state", "locked");
  await expect(outOfRange).toHaveAttribute("data-flash", "false");
});

test("the tooltip buttons unlock, level up and refund", async ({ page }) => {
  await node(page, MULTI_BASE).hover();
  const tip = tooltip(page, MULTI_BASE);
  await expect(tip).toBeVisible();
  await tip.locator('[data-action="unlock"]').click();
  await expectLevel(page, MULTI_BASE, 1);
  await tip.locator('[data-action="level-up"]').click();
  await expectLevel(page, MULTI_BASE, 2);
  await tip.locator('[data-action="refund-one"]').click();
  await expectLevel(page, MULTI_BASE, 1);
});

test("the hard cap blocks spending past the budget", async ({ page }) => {
  // Player level 1 with no biomes has a budget of 0 points.
  const code = encodeBuild({ skills: [], playerLevel: 1, unlockedBiomes: [] });
  await openPlanner(page, `/?code=${encodeURIComponent(code)}`);
  await expect(hud(page, "points-max")).toHaveText("/ 0");

  // Without the hard cap, going over budget is allowed.
  await node(page, SINGLE_BASE).click();
  await expectLevel(page, SINGLE_BASE, 1);
  await node(page, SINGLE_BASE).click();
  await expectLevel(page, SINGLE_BASE, 0);

  await hud(page, "settings").click();
  const settings = dialog(page, "settings");
  await expect(settings).toBeVisible();
  await settings.locator('[data-setting="hardcap"]').click();
  await expect(settings.locator('[data-setting="hardcap"]')).toHaveAttribute("data-checked", "true");
  await page.keyboard.press("Escape");
  await expect(settings).toHaveCount(0);

  await node(page, SINGLE_BASE).click();
  await expect(dialog(page, "skill-cap")).toBeVisible();
  await expectLevel(page, SINGLE_BASE, 0);
  await dialog(page, "skill-cap").locator('[data-action="confirm"]').click();
  await expect(dialog(page, "skill-cap")).toHaveCount(0);
});

test("reset clears the build", async ({ page }) => {
  await node(page, SINGLE_BASE).click();
  await expectLevel(page, SINGLE_BASE, 1);
  await hud(page, "reset").click();
  await dialog(page, "reset-confirm").locator('[data-action="confirm"]').click();
  await expectLevel(page, SINGLE_BASE, 0);
  await expect(hud(page, "points-used")).toHaveText("0");
});
