import { expect, test } from "./fixtures";
import { hud, openPlanner, waitForStableLayout } from "./helpers";
import { printTrace, startTrace } from "./zz-debug";

// TEMPORARY: trace a CI-only failure.
test("debug: Enter picks the highlighted result", async ({ page }) => {
  await openPlanner(page);
  await startTrace(page);
  try {
    await hud(page, "search-input").fill("double ju");
    await expect(page.locator('[data-search-result="DOUBLE_JUMP"]')).toBeVisible();
    await hud(page, "search-input").press("Enter");
    await expect(page.locator("[data-search-result]")).toHaveCount(0);
    await waitForStableLayout(page, "12");
    await expect(page.locator(`[data-skill-tooltip="12"]`)).toBeVisible({ timeout: 5000 });
  } finally {
    await printTrace(page, "desktop");
  }
});
