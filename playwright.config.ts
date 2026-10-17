import { defineConfig, devices } from "@playwright/test";

// Browser tests pin the planner's behavior through stable data-* hooks
// (data-node-id, data-state, data-level, data-hud, data-dialog, ...), never
// through internal DOM ids, so they keep passing if the renderer changes.
//
// The server runs without MONGODB_URI, so DB features are off. By default it
// is `next dev`; set PW_SERVER=start to test a production build (`yarn build`
// first), which is what CI does.
const PORT = Number(process.env.PW_PORT ?? 3101);
const BASE_URL = `http://localhost:${PORT}`;
const useBuild = process.env.PW_SERVER === "start";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/.results",
  snapshotPathTemplate: "{testDir}/__screenshots__/{projectName}/{arg}{ext}",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [["list"], ["html", { open: "never", outputFolder: "e2e/.report" }]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      testIgnore: [/mobile\.spec\.ts/, /visual\.spec\.ts/],
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "mobile",
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices["Pixel 7"] },
    },
    // Screenshot comparison of the main screens, run only on request
    // (`yarn e2e:visual`). The reference images are local only: fonts differ
    // between machines.
    {
      name: "visual",
      testMatch: /visual\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: useBuild ? `yarn start -p ${PORT}` : `yarn dev -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    // The card demo page (/card-demo) only exists where this is set.
    env: { MONGODB_URI: "", SKILL_TREE_DEMO_PAGES: "1" },
  },
});
