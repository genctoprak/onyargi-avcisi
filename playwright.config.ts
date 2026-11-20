import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  timeout: 45000,
  use: {
    baseURL: "http://127.0.0.1:3005",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(process.env.CI ? {} : { channel: "chrome" }),
      },
    },
  ],
  webServer: {
    command: "npx next start -p 3005 -H 127.0.0.1",
    url: "http://127.0.0.1:3005",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
    env: {
      DATABASE_URL: "file:./dev.db",
      STUDY_COLLECTION_ENABLED: "false",
      SESSION_SECRET: "onyargi-avcisi-gelistirme-gizli-anahtar-2026-degistirin",
      ADMIN_USERNAME: "arastirmaci",
      ADMIN_PASSWORD: "OnyargiAdmin2026!",
      NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3005",
    },
  },
});
