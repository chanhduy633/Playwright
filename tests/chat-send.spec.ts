import { test } from "@playwright/test";
import { ChatPage } from "../page/chat.page";

test("Worker A - User A send chat message", async ({ browser }, testInfo) => {
  console.log(
    `🚀 SEND | Worker=${testInfo.workerIndex} | PID=${process.pid}`,
  );

  const userAUrl = process.env.APP_USER_A_URL;

  if (!userAUrl) {
    throw new Error("APP_USER_A_URL is not configured in .env");
  }

  // Tạo BrowserContext riêng cho User A
  const contextA = await browser.newContext({
    recordVideo: {
      dir: testInfo.outputPath("videos"),
    },
  });

  const pageA = await contextA.newPage();
  const chatA = new ChatPage(pageA);

  try {
    await chatA.goto(userAUrl);

    await chatA.connectMeeting();
    await chatA.openChat();

    // Chờ User B join meeting
    await pageA.waitForTimeout(5000);

    const message = `Hello User B ${Date.now()}`;

    console.log(`📤 Sending message: ${message}`);

    await chatA.sendMessage(message);

    // Screenshot
    const screenshotPath = testInfo.outputPath("user-a-chat.png");

    await pageA.screenshot({
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
    // Lấy video trước khi đóng context
    const video = pageA.video();

    // Bắt buộc close context để Playwright finalize video
    await contextA.close();

    // Attach video vào result.json
    if (video) {
      const videoPath = await video.path();

      await testInfo.attach("video", {
        path: videoPath,
        contentType: "video/webm",
      });

      console.log("🎥 Video:", videoPath);
    } else {
      console.warn("⚠️ Không tìm thấy video");
    }
  }

  console.log(
    `✅ SEND DONE | Worker=${testInfo.workerIndex} | PID=${process.pid}`,
  );
});