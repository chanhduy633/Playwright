import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  testDir: "./tests",

  fullyParallel: true,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,

  workers: 2,

  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json",{outputFile: 'result.json'}],
    ["list"],
  ],

  use: {
    baseURL: process.env.APP_BASE_URL,

    screenshot: "on",
    video: "on",
    trace: "on",
    permissions: ["clipboard-read", "clipboard-write"],
    headless: false,
  },

  projects: [
    // =========================
    // CHROMIUM
    // =========================
    {
      name: "chromium",

      use: {
        ...devices["Desktop Chrome"],

        permissions: ["camera", "microphone"],

        launchOptions: {
          args: [
            "--use-fake-ui-for-media-stream",
            "--autoplay-policy=no-user-gesture-required",
          ],
        },
      },
    },

    // =========================
    // FIREFOX
    // =========================
    // {
    //   name: "firefox",

    //   use: {
    //     ...devices["Desktop Firefox"],
    //   },
    // },
  ],
}
);