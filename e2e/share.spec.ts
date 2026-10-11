import { readFile } from "node:fs/promises";

import { expect, test } from "./fixtures";

import {
  MULTI_BASE,
  SINGLE_BASE,
  dialog,
  encodeBuild,
  expectLevel,
  hud,
  node,
  nonBaseNeighbor,
  openPlanner,
  selectedLevels,
} from "./helpers";

const CHILD = nonBaseNeighbor(SINGLE_BASE);

async function makeBuild(page: import("@playwright/test").Page) {
  await node(page, SINGLE_BASE).click();
  await node(page, CHILD).click();
  await node(page, MULTI_BASE).click();
  await node(page, MULTI_BASE).click();
  await expectLevel(page, MULTI_BASE, 2);
  return { [SINGLE_BASE]: 1, [CHILD]: 1, [MULTI_BASE]: 2 };
}

async function exportJson(page: import("@playwright/test").Page) {
  await hud(page, "share").click();
  const share = dialog(page, "share");
  await expect(share).toBeVisible();
  // Without a database the advanced (JSON) section opens by itself.
  const downloadPromise = page.waitForEvent("download");
  await share.locator('[data-action="export-json"]').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("enshrouded-build.json");
  const path = await download.path();
  return { path, build: JSON.parse(await readFile(path, "utf8")) };
}

test("exported JSON holds the build, and a ?code= link of it loads the same build", async ({ page, browser }) => {
  await openPlanner(page);
  const expected = await makeBuild(page);
  expect(await selectedLevels(page)).toEqual(expected);

  const { build } = await exportJson(page);
  expect([...build.skills].sort()).toEqual(Object.keys(expected).sort());
  expect(build.skillLevels).toEqual(expected);
  expect(typeof build.treeContentHash).toBe("string");
  expect(build.playerLevel).toBeGreaterThan(0);
  expect(Array.isArray(build.unlockedBiomes)).toBe(true);

  // A fresh session (sessionStorage is per tab) opening the share link.
  const other = await browser.newContext();
  try {
    await other.route(/^https?:\/\/(?!localhost)/, (route) => route.abort());
    const page2 = await other.newPage();
    await openPlanner(page2, `/?code=${encodeURIComponent(encodeBuild(build))}`);
    await expect.poll(() => selectedLevels(page2)).toEqual(expected);
    await expect(hud(page2, "points-used")).toHaveText("4");
  } finally {
    await other.close();
  }
});

test("legacy ?code= links holding a plain id list still load", async ({ page }) => {
  await openPlanner(page, `/?code=${encodeURIComponent(encodeBuild([SINGLE_BASE, CHILD]))}`);
  await expect.poll(() => selectedLevels(page)).toEqual({ [SINGLE_BASE]: 1, [CHILD]: 1 });
});

test("an invalid ?code= keeps an empty tree", async ({ page }) => {
  await openPlanner(page, "/?code=not-a-code");
  await expect(page.locator('[data-node-id][data-selected="true"]')).toHaveCount(0);
});

test("importing an exported JSON file restores the build", async ({ page }) => {
  await openPlanner(page);
  const expected = await makeBuild(page);
  const { path } = await exportJson(page);
  await expect(dialog(page, "share")).toHaveCount(0);

  await hud(page, "reset").click();
  await dialog(page, "reset-confirm").locator('[data-action="confirm"]').click();
  await expect(page.locator('[data-node-id][data-selected="true"]')).toHaveCount(0);

  await hud(page, "share").click();
  await dialog(page, "share").locator('[data-action="import-file"]').setInputFiles(path);
  await expect(dialog(page, "share")).toHaveCount(0);
  await expect.poll(() => selectedLevels(page)).toEqual(expected);
});
