import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "tests/contracts/**/*.test.ts",
      "tests/contracts/**/*.test.tsx",
      "tests/integration/**/*.test.ts",
      "tests/integration/**/*.test.tsx",
      "tests/user-stories/**/*.test.ts",
      "tests/user-stories/**/*.test.tsx",
      "src/**/__tests__/**/*.test.ts",
      "src/**/__tests__/**/*.test.tsx",
      "src/**/*.test.ts",
      "src/**/*.test.tsx"
    ]
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
      "framer-motion": path.resolve(__dirname, "src/__mocks__/framer-motion.tsx")
    }
  }
});
