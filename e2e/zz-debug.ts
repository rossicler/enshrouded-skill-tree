import type { Page } from "@playwright/test";

// TEMPORARY: event trace for CI-only failures.
export async function startTrace(page: Page) {
  await page.evaluate(() => {
    const t0 = performance.now();
    const log: string[] = ((window as any).__log = []);
    const name = (el: any) => el?.getAttribute?.("data-node-id") ?? el?.getAttribute?.("data-skill-tooltip") ?? el?.tagName ?? String(el);
    for (const t of ["pointerdown", "pointerup", "pointerover", "pointerout", "touchstart", "touchend", "mouseover", "mouseout", "click", "keydown", "wheel"])
      document.addEventListener(t, (e: any) => log.push(`${Math.round(performance.now() - t0)} ${t} ${e.pointerType ?? ""} ${name(e.target)} rel=${name(e.relatedTarget)}`), true);
    new MutationObserver(() => {
      const tips = Array.from(document.querySelectorAll("[data-skill-tooltip]")).map((el) => el.getAttribute("data-skill-tooltip"));
      const rt = Array.from(document.querySelectorAll(".react-tooltip")).map((el) => el.className.split(" ").filter((c) => c.includes("show") || c.includes("closing")).join("+"));
      const key = `tips=${tips.join(",")} rt=${rt.join(",")}`;
      if (log[log.length - 1]?.endsWith(key)) return;
      log.push(`${Math.round(performance.now() - t0)} DOM ${key}`);
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  });
}

export async function printTrace(page: Page, label: string) {
  const log = await page.evaluate(() => (window as any).__log as string[]);
  console.log(`=== TRACE ${label}\n${log.slice(-60).join("\n")}\n=== END`);
}
