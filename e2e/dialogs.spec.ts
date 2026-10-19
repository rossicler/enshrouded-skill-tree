import { expect, test } from "./fixtures";

import { SINGLE_BASE, dialog, hud, node, openPlanner } from "./helpers";

// A dialog closed while it is still fading in, in the same click as a large
// render (the reset redraws the tree), must still go away. Headless UI's own
// transitions could leave it mounted for good, invisible over the page. That
// was a race (roughly one close in a hundred), so this closes it 20 times at
// different points of the fade-in; the unit test in
// packages/react/src/__tests__/GameDialog.test.tsx covers the logic exactly.
test("a dialog closed while it fades in, during a large render, unmounts", async ({ page }) => {
  await openPlanner(page);
  for (let i = 0; i < 20; i++) {
    await node(page, SINGLE_BASE).click();
    await expect(node(page, SINGLE_BASE)).toHaveAttribute("data-selected", "true");
    // Confirm from the page, 0 to 285 ms after the button exists: a Playwright
    // click would wait for the panel to stop scaling, after the fade-in.
    await page.evaluate(async (delay) => {
      (document.querySelector('[data-hud="reset"]') as HTMLElement).click();
      const confirm = await new Promise<HTMLElement>((resolve) => {
        const find = () => {
          const el = document.querySelector<HTMLElement>('[data-dialog="reset-confirm"] [data-action="confirm"]');
          if (el) resolve(el);
          else requestAnimationFrame(find);
        };
        find();
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
      confirm.click();
    }, i * 15);
    await expect(page.locator('[data-node-id][data-selected="true"]')).toHaveCount(0);
    await expect(dialog(page, "reset-confirm"), `close ${i + 1}`).toHaveCount(0);
  }
  // Nothing invisible is left over the tree.
  await hud(page, "share").click();
  await expect(dialog(page, "share")).toBeVisible();
});
