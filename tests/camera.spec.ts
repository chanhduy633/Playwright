import { test } from "@playwright/test";
import { CameraPage } from "../page/camera.page";

test.setTimeout(90_000);

test("2 users - User A bật camera và User B nhận camera stream", async ({
  browser,
}) => {
  const userAUrl = process.env.APP_USER_A_URL;
  const userBUrl = process.env.APP_USER_B_URL;

  if (!userAUrl || !userBUrl) {
    throw new Error(
      "Thiếu APP_USER_A_URL hoặc APP_USER_B_URL trong file .env",
    );
  }

  // =====================================================
  // USER A
  // =====================================================

  const contextA = await browser.newContext({
    permissions: ["camera", "microphone"],

    recordVideo: {
      dir: "test-results",
      size: {
        width: 1280,
        height: 720,
      },
    },
  });

  const pageA = await contextA.newPage();
  const cameraA = new CameraPage(pageA);

  await cameraA.goto(userAUrl);
  await cameraA.connectMeeting();

  // =====================================================
  // USER B
  // =====================================================

  const contextB = await browser.newContext({
    permissions: ["camera", "microphone"],

    recordVideo: {
      dir: "test-results/videos/camera",
      size: {
        width: 1280,
        height: 720,
      },
    },
  });

  const pageB = await contextB.newPage();
  const cameraB = new CameraPage(pageB);

  await cameraB.goto(userBUrl);
  await cameraB.connectMeeting();

  // =====================================================
  // USER A BẬT CAMERA
  // =====================================================

  await cameraA.turnOnCamera();

  // =====================================================
  // VERIFY USER A CÓ CAMERA STREAM
  // =====================================================

  await cameraA.expectCameraStream();

  console.log("User A: camera stream OK");

  // =====================================================
  // VERIFY USER B NHẬN CAMERA STREAM
  // =====================================================

  await cameraB.expectRemoteCameraStream();

  console.log("User B: nhận camera stream OK");

  // =====================================================
  // DEBUG
  // =====================================================

  await cameraA.debugVideos();
  await cameraB.debugVideos();

  // =====================================================
  // SCREENSHOT
  // =====================================================

  await pageA.screenshot({
    path: "test-results/camera-user-a.png",
    fullPage: true,
  });

  await pageB.screenshot({
    path: "test-results/camera-user-b.png",
    fullPage: true,
  });

  // =====================================================
  // CLEANUP
  // =====================================================

  await contextA.close();
  await contextB.close();
});