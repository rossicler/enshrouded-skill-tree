import { test as base } from "@playwright/test";

export { expect } from "@playwright/test";

// Every test gets a page that only talks to the local server: ads and
// analytics would add network noise and can inject overlays.
export const test = base.extend({
  context: async ({ context, baseURL }, use) => {
    const origin = new URL(baseURL!).origin;
    await context.route(
      (url) => url.origin !== origin && (url.protocol === "http:" || url.protocol === "https:"),
      (route) => route.abort(),
    );
    await use(context);
  },
});
