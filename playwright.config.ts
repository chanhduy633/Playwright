import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  testDir: "./tests",

  // Không để Playwright tự parallel các test bên trong cùng project
  fullyParallel: false,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,

  // 1 worker cho Admin + 1 worker cho User
  workers: 2,

  reporter: [
    [
      "html",
      {
        outputFolder: "playwright-report",
        open: "never",
      },
    ],
    [
      "json",
      {
        outputFile: "test-results/result.json",
      },
    ],
    ["list"],
  ],

  use: {
    baseURL: process.env.APP_BASE_URL,

    screenshot: "on",
    video: "on",
    trace: "on",

    headless: false,

    permissions: [
      "clipboard-read",
      "clipboard-write",
    ],
  },

  projects: [
    // ============================================================
    // ADMIN
    // ============================================================

    {
      name: "admin",

      testMatch: /admin\.spec\.ts/,

      use: {
        ...devices["Desktop Chrome"],

        permissions: [
          "camera",
          "microphone",
          "clipboard-read",
          "clipboard-write",
        ],

        launchOptions: {
          args: [
            "--use-fake-ui-for-media-stream",
            "--autoplay-policy=no-user-gesture-required",
          ],
        },
      },
    },

    // ============================================================
    // USER
    // ============================================================

    {
      name: "user",

      testMatch: /user\.spec\.ts/,

      use: {
        ...devices["Desktop Chrome"],

        permissions: [
          "camera",
          "microphone",
          "clipboard-read",
          "clipboard-write",
        ],

        launchOptions: {
          args: [
            "--use-fake-ui-for-media-stream",
            "--autoplay-policy=no-user-gesture-required",
          ],
        },
      },
    },
  ],
});