import path from "path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    // e2e/ holds the Playwright browser tests (yarn e2e); .claude/ holds other
    // sessions' worktrees, each a full copy of the repository.
    exclude: [...configDefaults.exclude, "e2e/**", ".claude/**"],
  },
});
