import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 2,
  globalSetup: "./global-setup.ts",
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["list"],
  ],
  use: {
    baseURL: process.env.APP_BASE_URL,
    screenshot: "on",
    video: "off",
    headless: false,
  },
  projects: [
    {
      name: "admin",
      testMatch: /admin.*\.spec\.ts/,
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
            "--disable-features=WebRtcHideLocalIpsWithMdns",
            "--force-webrtc-ip-handling-policy=default_public_and_private_interfaces",
            // Giữ cho luồng video capture không bị pause khi tab mất focus
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
          ],
        },
      },
    },
    {
      name: "user",
      testMatch: /user.*\.spec\.ts/,
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
            "--disable-features=WebRtcHideLocalIpsWithMdns",
            "--force-webrtc-ip-handling-policy=default_public_and_private_interfaces",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
          ],
        },
      },
    },
  ],
});
