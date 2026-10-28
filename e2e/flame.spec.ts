import { expect, test } from "./fixtures";

import progression from "../packages/core/src/constants/gameProgression.json";
import { hud, openPlanner } from "./helpers";

// The flame level control stops at the game's flame level cap, and the stats
// count one point per attribute for each level after the first.
const MAX = progression.flame.flameLevelCap;

test.beforeEach(async ({ page }) => {
  await openPlanner(page);
});

test("the flame level goes from 1 up to the game's cap and no further", async ({ page }) => {
  await expect(hud(page, "flame-level")).toHaveValue("1");
  await expect(hud(page, "flame-down")).toBeDisabled();

  for (let level = 2; level <= MAX; level++) {
    await hud(page, "flame-up").click();
    await expect(hud(page, "flame-level")).toHaveValue(String(level));
  }
  await expect(hud(page, "flame-up")).toBeDisabled();

  await hud(page, "flame-level").fill(String(MAX + 1));
  await expect(hud(page, "flame-level")).toHaveValue(String(MAX));

  await hud(page, "stats").click();
  await expect(page.locator('[data-panel="stats"] [data-stat="STR"]')).toHaveText(String(MAX - 1));
});

test("a typed flame level within the cap is kept", async ({ page }) => {
  await hud(page, "flame-level").fill("3");
  await expect(hud(page, "flame-level")).toHaveValue("3");
  await hud(page, "stats").click();
  await expect(page.locator('[data-panel="stats"] [data-stat="CONS"]')).toHaveText("2");
});
