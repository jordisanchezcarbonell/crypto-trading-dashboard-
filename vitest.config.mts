import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: [
      // `server-only` throws when required outside a React Server Components
      // bundler. Vitest doesn't set up those conditions, so we alias it to a
      // no-op module for tests. Production code is unaffected — Next.js still
      // resolves the real `server-only` and enforces the boundary.
      {
        find: /^server-only$/,
        replacement: fileURLToPath(
          new URL("./__mocks__/server-only.ts", import.meta.url)
        ),
      },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["__tests__/**/*.test.{ts,tsx}"],
    css: false,
  },
});
