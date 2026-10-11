import { devices } from "@playwright/test";
import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

import { MULTI_BASE, SINGLE_BASE, dialog, encodeBuild, hud, node, nonBaseNeighbor, openPlanner, tooltip } from "./helpers";

// Screenshot comparison of the main screens, run only by `yarn e2e:visual`. Record references on one stack with
// `--update-snapshots`, then run again on the other to see the drift.
// References live in e2e/__screenshots__ (gitignored: fonts vary by machine).

const { defaultBrowserType: _ignored, ...pixel } = devices["Pixel 7"];

const screens = (device: "desktop" | "mobile", locale: "en" | "fr") => {
  const touch = device === "mobile";
  const prefix = locale === "fr" ? "/fr" : "";
  const shot = async (page: Page, name: string) => {
    // Lazy images would otherwise still be loading in some runs.
    await page.evaluate(() =>
      document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((img) => (img.loading = "eager")),
    );
    await page.waitForFunction(() => Array.from(document.images).every((img) => img.complete));
    await expect(page).toHaveScreenshot(`${device}-${locale}-${name}.png`, { animations: "disabled", maxDiffPixelRatio: 0.002 });
  };

  test(`tree (${locale})`, async ({ page }) => {
    await openPlanner(page, `${prefix}/`);
    await page.mouse.move(1, 1);
    await shot(page, "tree");
  });

  test(`build and tooltip (${locale})`, async ({ page }) => {
    const build = {
      skills: [SINGLE_BASE, nonBaseNeighbor(SINGLE_BASE), MULTI_BASE],
      skillLevels: { [SINGLE_BASE]: 1, [nonBaseNeighbor(SINGLE_BASE)]: 1, [MULTI_BASE]: 2 },
    };
    await openPlanner(page, `${prefix}/?code=${encodeURIComponent(encodeBuild(build))}`);
    await expect(node(page, MULTI_BASE)).toHaveAttribute("data-level", "2");
    await page.mouse.move(1, 1);
    // Let the build-loaded toasts disappear.
    await page.waitForTimeout(6000);
    await shot(page, "build");
    if (!touch) {
      await node(page, MULTI_BASE).hover();
      await expect(tooltip(page, MULTI_BASE)).toBeVisible();
      await page.waitForTimeout(300);
      await shot(page, "tooltip");
    }
  });

  test(`toast (${locale})`, async ({ page }) => {
    await openPlanner(page, `${prefix}/?code=not-a-code`);
    await expect(page.locator(".Toastify__toast")).toBeVisible();
    await page.mouse.move(1, 1);
    await page.waitForTimeout(800);
    await shot(page, "toast");
  });

  test(`search (${locale})`, async ({ page }) => {
    await openPlanner(page, `${prefix}/`);
    await hud(page, "search-input").fill(locale === "fr" ? "saut" : "jump");
    await page.mouse.move(1, 1);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await shot(page, "search");
  });

  for (const name of ["share", "settings", "about"] as const) {
    test(`${name} dialog (${locale})`, async ({ page }) => {
      await openPlanner(page, `${prefix}/`);
      await hud(page, name).click();
      await expect(dialog(page, name)).toBeVisible();
      await page.waitForTimeout(500);
      await shot(page, `dialog-${name}`);
    });
  }

  test(`refund confirm dialog (${locale})`, async ({ page }) => {
    test.skip(!!touch, "desktop only");
    await openPlanner(page, `${prefix}/`);
    await node(page, MULTI_BASE).click();
    await node(page, "1").click();
    await node(page, MULTI_BASE).click({ button: "right" });
    await expect(dialog(page, "refund-confirm")).toBeVisible();
    await page.mouse.move(1, 1);
    await page.waitForTimeout(500);
    await shot(page, "dialog-refund");
  });
};

test.describe("desktop", () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  screens("desktop", "en");
  screens("desktop", "fr");
});

test.describe("mobile", () => {
  test.use(pixel);
  screens("mobile", "en");
  screens("mobile", "fr");
});
