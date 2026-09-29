import { test } from "@playwright/test";
import { CameraPage } from "../page/camera.page";
import fs from "fs";
import path from "path";

test.setTimeout(90_000);

test("Worker A - User A bật camera", async ({ browser }, testInfo) => {
  console.log(
    `🚀 CAMERA SEND | Worker=${testInfo.workerIndex} | PID=${process.pid}`,
  );

  const userAUrl = process.env.APP_USER_A_URL;

  if (!userAUrl) {
    throw new Error("APP_USER_A_URL is not configured in .env");
  }

  const signalDir = path.join("test-results", "signals");
  const signalFile = path.join(signalDir, "camera-ready.txt");

  fs.mkdirSync(signalDir, { recursive: true });

  // Xóa signal cũ
  if (fs.existsSync(signalFile)) {
    fs.unlinkSync(signalFile);
  }

  const contextA = await browser.newContext({
    recordVideo: {
      dir: testInfo.outputPath("videos"),
      size: {
        width: 1280,
        height: 720,
      },
    },
  });

  const pageA = await contextA.newPage();
  const cameraA = new CameraPage(pageA);

  try {
    await cameraA.goto(userAUrl);

    await cameraA.connectMeeting();

    // Bật camera
    await cameraA.turnOnCamera();

    // Xác nhận User A có stream
    await cameraA.expectCameraStream();

    console.log("📹 User A: camera stream OK");

    await cameraA.debugVideos();

    // Screenshot
    const screenshotPath = testInfo.outputPath("camera-user-a.png");

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

    // Báo Worker B
    fs.writeFileSync(signalFile, "CAMERA_READY");

    console.log("📢 Camera ready signal created");

    // Giữ User A trong meeting
    await pageA.waitForTimeout(15_000);
  } finally {
    // Lấy video trước khi đóng context
    const video = pageA.video();

    // Đóng context để finalize video
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
      console.warn("⚠️ Không tìm thấy video User A");
    }
  }

  console.log(
    `✅ CAMERA SEND DONE | Worker=${testInfo.workerIndex} | PID=${process.pid}`,
  );
});