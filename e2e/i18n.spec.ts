import { expect, test } from "./fixtures";

import { MULTI_BASE, dialog, expectLevel, hud, node, openPlanner, tooltip } from "./helpers";

test("the settings dialog switches the site to French and keeps the build", async ({ page }) => {
  await openPlanner(page);
  await expect(hud(page, "search-input")).toHaveAttribute("placeholder", "Search");
  await node(page, MULTI_BASE).click();
  await expectLevel(page, MULTI_BASE, 1);

  await hud(page, "settings").click();
  await dialog(page, "settings").locator('[data-setting="language"]').selectOption("fr");
  await expect(page).toHaveURL(/\/fr\/?$/);
  await expect(hud(page, "search-input")).toHaveAttribute("placeholder", "Rechercher");
  await expectLevel(page, MULTI_BASE, 1);
});

test("/fr shows French skill text", async ({ page }) => {
  await openPlanner(page, "/fr");
  await hud(page, "search-input").fill("double sa");
  const result = page.locator('[data-search-result="DOUBLE_JUMP"]');
  await expect(result).toContainText("Double saut");
  await node(page, "12").hover();
  await expect(tooltip(page, "12")).toContainText("Double saut");
});

test("/de shows the game's German skill text", async ({ page }) => {
  await openPlanner(page, "/de");
  await expect(hud(page, "search-input")).toHaveAttribute("placeholder", "Suchen");
  await node(page, "12").hover();
  await expect(tooltip(page, "12")).toContainText("Doppelsprung");
});

test("/ja searches Japanese skill names with a two-character query", async ({ page }) => {
  await openPlanner(page, "/ja");
  await hud(page, "search-input").fill("二段");
  await expect(page.locator('[data-search-result="DOUBLE_JUMP"]')).toBeVisible();
});
