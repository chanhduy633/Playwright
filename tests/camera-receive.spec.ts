import { test } from "@playwright/test";
import { CameraPage } from "../page/camera.page";
import fs from "fs";
import path from "path";

test.setTimeout(90_000);

test("Worker B - User B nhận camera stream", async ({
  browser,
}, testInfo) => {
  console.log(
    `🚀 CAMERA RECEIVE | Worker=${testInfo.workerIndex} | PID=${process.pid}`,
  );

  const userBUrl = process.env.APP_USER_B_URL;

  if (!userBUrl) {
    throw new Error("APP_USER_B_URL is not configured in .env");
  }

  const signalFile = path.join(
    "test-results",
    "signals",
    "camera-ready.txt",
  );

  const contextB = await browser.newContext({
    recordVideo: {
      dir: testInfo.outputPath("videos"),
      size: {
        width: 1280,
        height: 720,
      },
    },
  });

  const pageB = await contextB.newPage();
  const cameraB = new CameraPage(pageB);

  try {
    await cameraB.goto(userBUrl);

    await cameraB.connectMeeting();

    console.log("👤 User B đã vào meeting");

    // Chờ Worker A bật camera
    await test.expect
      .poll(() => fs.existsSync(signalFile), {
        timeout: 30_000,
        message: "Không nhận được signal CAMERA_READY từ User A",
      })
      .toBe(true);

    console.log("📢 User B nhận được CAMERA_READY signal");

    // Chờ remote video stream
    await cameraB.expectRemoteCameraStream();

    console.log("📹 User B: nhận camera stream OK");

    await cameraB.debugVideos();

    // Screenshot
    const screenshotPath = testInfo.outputPath("camera-user-b.png");

    await pageB.screenshot({
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
    const video = pageB.video();

    // Đóng context để finalize video
    await contextB.close();

    // Attach video vào result.json
    if (video) {
      const videoPath = await video.path();

      await testInfo.attach("video", {
        path: videoPath,
        contentType: "video/webm",
      });

      console.log("🎥 Video:", videoPath);
    } else {
      console.warn("⚠️ Không tìm thấy video User B");
    }
  }

  console.log(
    `✅ CAMERA RECEIVE DONE | Worker=${testInfo.workerIndex} | PID=${process.pid}`,
  );
});