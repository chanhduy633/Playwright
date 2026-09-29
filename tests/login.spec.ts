import { test, expect } from "@playwright/test";

import { LoginPage } from "../page/login.page";

test("Login APP successfully", async ({ page }, testInfo) => {
  const loginPage = new LoginPage(page);

  const loginUrl = process.env.APP_LOGIN_URL;
  const username = process.env.APP_USERNAME;
  const password = process.env.APP_PASSWORD;

  if (!loginUrl) {
    throw new Error("APP_LOGIN_URL is not configured");
  }

  if (!username) {
    throw new Error("APP_USERNAME is not configured");
  }

  if (!password) {
    throw new Error("APP_PASSWORD is not configured");
  }

  try {
    await loginPage.goto();

    await loginPage.openLoginPage();

    await expect(page).toHaveURL(loginUrl);

    await loginPage.login(username, password);

    await expect(page).not.toHaveURL(loginUrl);

    // Screenshot
    const screenshotPath = testInfo.outputPath("login-success.png");

    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    // Attach screenshot vào result.json
    await testInfo.attach("screenshot", {
      path: screenshotPath,
      contentType: "image/png",
    });

    console.log("📸 Screenshot:", screenshotPath);
  } finally {
    // Với fixture { page }, Playwright sẽ tự quản lý context/video.
    // Lấy video sau khi page/context được Playwright finalize
    const video = page.video();

    if (video) {
      try {
        const videoPath = await video.path();

        await testInfo.attach("video", {
          path: videoPath,
          contentType: "video/webm",
        });

        console.log("🎥 Video:", videoPath);
      } catch (error) {
        console.warn("⚠️ Không thể attach video:", error);
      }
    } else {
      console.warn("⚠️ Không tìm thấy video");
    }
  }
});