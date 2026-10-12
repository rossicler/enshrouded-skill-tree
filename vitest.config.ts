import path from "path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    // e2e/ holds the Playwright browser tests (yarn e2e).
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
