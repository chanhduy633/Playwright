import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { CameraPage } from "../page/camera.page";

const DATA_DIR = path.resolve("test-data");
const JOIN_URL_FILE = path.join(DATA_DIR, "join-url.json");
const ADMIN_READY_FILE = path.join(DATA_DIR, "admin-ready.json");
const USER_REQUESTED_FILE = path.join(DATA_DIR, "user-requested.json");
const MEDIA_READY_FILE = path.join(DATA_DIR, "media-ready.json");
const ADMIN_VERIFIED_FILE = path.join(DATA_DIR, "admin-verified.json");

test("User", async ({ page, context }) => {
  test.setTimeout(180_000);

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // ============================================================
  // 1. CHỜ ADMIN READY
  // ============================================================
  console.log("User - Đang chờ Admin ready...");

  await expect
    .poll(
      () => {
        if (!fs.existsSync(ADMIN_READY_FILE)) return false;
        try {
          return (
            JSON.parse(fs.readFileSync(ADMIN_READY_FILE, "utf-8")).ready ===
            true
          );
        } catch {
          return false;
        }
      },
      { timeout: 60_000, intervals: [200, 500, 1000] },
    )
    .toBe(true);

  console.log("User - Admin đã ready");

  // ============================================================
  // 2. ĐỌC JOIN URL & CẤP QUYỀN CAMERA CHO ORIGIN
  // ============================================================
  const data = JSON.parse(fs.readFileSync(JOIN_URL_FILE, "utf-8"));
  const joinUrl = data.joinUrl;

  expect(joinUrl, "join-url.json không có joinUrl").toBeTruthy();
  console.log("User - Join URL:", joinUrl);

  const origin = new URL(joinUrl).origin;
  await context.grantPermissions(["camera", "microphone"], { origin });

  // ============================================================
  // 3. MỞ JOIN URL
  // ============================================================
  await page.goto(joinUrl, { waitUntil: "domcontentloaded" });
  console.log("User - Đã mở Join URL");

  // ============================================================
  // 4. NHẬP TÊN
  // ============================================================
  const nameInput = page.getByRole("textbox", { name: "Họ và tên *" });
  await expect(nameInput).toBeVisible({ timeout: 30_000 });
  await nameInput.fill("Devtest");

  // ============================================================
  // 5. CLICK THAM GIA
  // ============================================================
  const joinButton = page.getByRole("button", { name: "Tham gia" });
  await expect(joinButton).toBeEnabled({ timeout: 10_000 });
  await joinButton.click();
  console.log("User - Đã click Tham gia");

  // ============================================================
  // 6. CHỜ URL THAY ĐỔI
  // ============================================================
  await expect
    .poll(() => page.url(), { timeout: 30_000, intervals: [200, 500, 1000] })
    .not.toBe(joinUrl);

  console.log("User - URL sau khi click:", page.url());

  // ============================================================
  // 7. BÁO CHO ADMIN REQUEST
  // ============================================================
  fs.writeFileSync(
    USER_REQUESTED_FILE,
    JSON.stringify(
      { requested: true, requestedAt: new Date().toISOString() },
      null,
      2,
    ),
    "utf-8",
  );
  console.log("User - Đã báo request cho Admin");

  // ============================================================
  // 8. CHỜ ADMIN APPROVE VÀO ROOM
  // ============================================================
  await expect
    .poll(() => page.url(), { timeout: 60_000, intervals: [200, 500, 1000] })
    .toContain("/room");

  console.log("User - Đã vào phòng");

  // ============================================================
  // 9. PHẦN CAMERA: KÍCH HOẠT CAMERA THẬT
  // ============================================================
  const cameraPage = new CameraPage(page);

  await cameraPage.connectMeeting();
  await cameraPage.turnOnCamera();
  await cameraPage.expectCameraStream();

  // Báo cho Admin biết camera đã bật
  fs.writeFileSync(
    MEDIA_READY_FILE,
    JSON.stringify({ ready: true, readyAt: new Date().toISOString() }, null, 2),
    "utf-8",
  );
  console.log("User - Đã phát luồng camera thật và báo Admin");

  // Đợi Admin xác nhận đã xem thấy hình
  await expect
    .poll(
      () => {
        if (!fs.existsSync(ADMIN_VERIFIED_FILE)) return false;
        try {
          return (
            JSON.parse(fs.readFileSync(ADMIN_VERIFIED_FILE, "utf-8"))
              .verified === true
          );
        } catch {
          return false;
        }
      },
      { timeout: 60_000, intervals: [500, 1000] },
    )
    .toBe(true);
  await page.waitForTimeout(3000);
  // ============================================================
  // 10. RESET JOIN URL & HOÀN TẤT
  // ============================================================
  fs.writeFileSync(JOIN_URL_FILE, JSON.stringify({}, null, 2), "utf-8");
  console.log("User - Đã reset join-url.json");
  console.log("User - Test passed");
});
