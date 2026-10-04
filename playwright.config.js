import { defineConfig, devices } from "@playwright/test";

const port = 4173;
// E2E_TARGET=preview runs the tests against the production build instead of the dev server
const usePreview = process.env.E2E_TARGET === "preview";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1400, height: 900 } }
    }
  ],
  webServer: {
    command: usePreview
      ? `npm run build && npx vite preview --port ${port} --strictPort`
      : `npx vite --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  }
});
