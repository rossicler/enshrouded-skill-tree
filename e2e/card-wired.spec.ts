import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

import progression from "../packages/core/src/constants/gameProgression.json";
import skillData from "../packages/core/src/constants/gameSkillData.json";
import { SAMPLE_BUILD, card, distanceIn, inCard, levelsIn, openDemo, waitForStableCard } from "./cards";
import { MULTI_BASE, MULTI_BASE_CHILD, SINGLE_BASE, checkFixtureAssumptions, typeOf } from "./helpers";

// The demo page's wired section: a card fed to the points panel, stats and
// search of @enshrouded/react through usePoints, useStats and useSkillSearch.

const types = skillData.types as Record<string, { cost?: number; stats?: Record<string, number> }>;
const cost = (id: string) => types[typeOf(id)].cost ?? 0;
const pointsOf = (selection: Record<string, number>) =>
  Object.entries(selection).reduce((sum, [id, level]) => sum + cost(id) * level, 0);
const levelingPoints = (level: number) => (level - 1) * progression.leveling.skillPointsPerLevel;
const BIOME_POINTS = Object.values(progression.biomes).reduce((sum, biome) => sum + biome.points, 0);
const MAX_POINTS = levelingPoints(progression.leveling.playerLevelCap) + BIOME_POINTS;
// A stat's total: the selected skills' points plus one per flame level after the first.
const statOf = (selection: Record<string, number>, stat: string, flameLevel = 1) =>
  Object.entries(selection).reduce((sum, [id, level]) => sum + (types[typeOf(id)].stats?.[stat] ?? 0) * level, 0) +
  flameLevel - 1;

const wired = (page: Page) => page.locator("[data-demo-wired]");
const wiredHook = (page: Page, name: string) => wired(page).locator(`[data-hud="${name}"]`);
const wiredStat = (page: Page, stat: string) => wired(page).locator(`[data-demo-stats] [data-stat="${stat}"]`);

test.beforeAll(() => checkFixtureAssumptions());

test.beforeEach(async ({ page }) => {
  await openDemo(page);
  await wired(page).scrollIntoViewIfNeeded();
  await waitForStableCard(card(page, "wired"));
});

test("editing the card updates the points panel", async ({ page }) => {
  const c = card(page, "wired");
  expect(await levelsIn(c)).toEqual(SAMPLE_BUILD);
  const used = pointsOf(SAMPLE_BUILD);
  await expect(wiredHook(page, "points-used")).toHaveText(String(used));
  await expect(wiredHook(page, "points-max")).toHaveText(`/ ${MAX_POINTS}`);
  await expect(wired(page).locator("[data-demo-points-left]")).toHaveText(String(MAX_POINTS - used));

  await inCard(c, MULTI_BASE_CHILD).click({ button: "right" });
  await expect(inCard(c, MULTI_BASE_CHILD)).toHaveAttribute("data-selected", "false");
  const after = used - cost(MULTI_BASE_CHILD);
  await expect(wiredHook(page, "points-used")).toHaveText(String(after));
  await expect(wired(page).locator("[data-demo-points-left]")).toHaveText(String(MAX_POINTS - after));

  // The other cards and their counts are untouched.
  expect(await levelsIn(card(page, "b"))).toEqual(SAMPLE_BUILD);
});

test("the stats follow the build and the flame level", async ({ page }) => {
  const c = card(page, "wired");
  // SINGLE_BASE is an attribute node: refunding it lowers its stat.
  const [stat] = Object.keys(types[typeOf(SINGLE_BASE)].stats ?? {});
  expect(stat).toBeTruthy();
  await expect(wiredStat(page, stat)).toHaveText(String(statOf(SAMPLE_BUILD, stat)));
  await inCard(c, SINGLE_BASE).click({ button: "right" });
  const { [SINGLE_BASE]: _refunded, ...rest } = SAMPLE_BUILD;
  await expect(wiredStat(page, stat)).toHaveText(String(statOf(rest, stat)));

  await wiredHook(page, "flame-up").click();
  await expect(wiredHook(page, "flame-level")).toHaveValue("2");
  await expect(wiredStat(page, stat)).toHaveText(String(statOf(rest, stat, 2)));
  await expect(wiredStat(page, "INT")).toHaveText(String(statOf(rest, "INT", 2)));

  // The stats button opens the same totals in a dialog.
  await wiredHook(page, "stats").click();
  const statsDialog = page.locator('[data-dialog="stats"]');
  await expect(statsDialog.locator('[data-stat="INT"]')).toHaveText(String(statOf(rest, "INT", 2)));
  await page.keyboard.press("Escape");
  await expect(statsDialog).toHaveCount(0);
});

test("the biome budget changes the budget", async ({ page }) => {
  const [first] = Object.entries(progression.biomes);
  await wiredHook(page, "biome-budget").click();
  const budget = page.locator('[data-dialog="biome-budget"]');
  await expect(budget).toBeVisible();
  await budget.locator(`[data-biome="${first[0]}"]`).click();
  await expect(budget.locator(`[data-biome="${first[0]}"]`)).toHaveAttribute("aria-checked", "false");
  await expect(budget.locator('[data-budget="total"]')).toHaveText(String(MAX_POINTS - first[1].points));
  await budget.locator('[data-budget="player-level"]').fill("10");
  const max = levelingPoints(10) + BIOME_POINTS - first[1].points;
  await expect(budget.locator('[data-budget="total"]')).toHaveText(String(max));
  await page.keyboard.press("Escape");
  await expect(budget).toHaveCount(0);
  await expect(wiredHook(page, "points-max")).toHaveText(`/ ${max}`);
});

test("search highlights matches in the card and a result zooms to its node", async ({ page }) => {
  const c = card(page, "wired");
  const start = await distanceIn(c, SINGLE_BASE, MULTI_BASE);
  await wiredHook(page, "search-input").fill("double ju");
  await expect(inCard(c, "12")).toHaveAttribute("data-searched", "true");
  // Only the wired card highlights.
  await expect(inCard(card(page, "a"), "12")).not.toHaveAttribute("data-searched", "true");

  const result = wired(page).locator('[data-search-result="DOUBLE_JUMP"]');
  await expect(result).toContainText("Double Jump");
  await result.click();
  await expect(wiredHook(page, "search-input")).toHaveValue("Double Jump");
  await expect(wired(page).locator("[data-search-result]")).toHaveCount(0);
  await waitForStableCard(c, "12");
  expect(await distanceIn(c, SINGLE_BASE, MULTI_BASE)).toBeGreaterThan(start * 2);
  // The node ends up in the middle of the card. (The tooltip that focusNode
  // opens isn't asserted: it depends on where the real mouse is.)
  const box = (await c.boundingBox())!;
  const target = (await inCard(c, "12").boundingBox())!;
  expect(Math.abs(target.x + target.width / 2 - (box.x + box.width / 2))).toBeLessThan(5);
  expect(Math.abs(target.y + target.height / 2 - (box.y + box.height / 2))).toBeLessThan(5);

  await wiredHook(page, "search-input").fill("");
  await expect(c.locator('[data-node-id][data-searched="true"]')).toHaveCount(0);
});
