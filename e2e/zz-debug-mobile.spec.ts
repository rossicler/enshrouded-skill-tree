import { expect, test } from "./fixtures";
import { MULTI_BASE, SINGLE_BASE, anyTooltip, emptyTreePoint, expectLevel, node, openPlanner, tooltip } from "./helpers";
import { printTrace, startTrace } from "./zz-debug";

// TEMPORARY: trace a CI-only failure.
test("debug: after a tooltip button, tap empty, tap another node", async ({ page }) => {
  await openPlanner(page);
  await startTrace(page);
  try {
    await node(page, MULTI_BASE).tap();
    const tip = tooltip(page, MULTI_BASE);
    await expect(tip).toBeVisible();
    await tip.locator('[data-action="unlock"]').tap();
    await expectLevel(page, MULTI_BASE, 1);
    const p = await emptyTreePoint(page);
    console.log("empty point", p, "17 box", await node(page, SINGLE_BASE).boundingBox());
    await page.touchscreen.tap(p.x, p.y);
    await expect(anyTooltip(page)).toHaveCount(0);
    await node(page, SINGLE_BASE).tap();
    await expect(tooltip(page, SINGLE_BASE)).toBeVisible({ timeout: 5000 });
  } finally {
    await printTrace(page, "mobile");
  }
});
