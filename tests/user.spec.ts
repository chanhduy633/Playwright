import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const DATA_DIR = path.resolve("test-data");

const JOIN_URL_FILE = path.join(
  DATA_DIR,
  "join-url.json"
);

const ADMIN_READY_FILE = path.join(
  DATA_DIR,
  "admin-ready.json"
);

const USER_REQUESTED_FILE = path.join(
  DATA_DIR,
  "user-requested.json"
);

test("User", async ({ page }) => {
  test.setTimeout(120_000);

  // ============================================================
  // 1. CHỜ ADMIN READY
  // ============================================================
 if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {
      recursive: true,
    });
  }
  
  console.log(
    "User - Đang chờ Admin ready..."
  );

  await expect
    .poll(
      () => {
        if (!fs.existsSync(ADMIN_READY_FILE)) {
          return false;
        }

        try {
          const data = JSON.parse(
            fs.readFileSync(
              ADMIN_READY_FILE,
              "utf-8"
            )
          );

          return data.ready === true;
        } catch {
          return false;
        }
      },
      {
        timeout: 60_000,
        intervals: [200, 500, 1000],
      }
    )
    .toBe(true);

  console.log(
    "User - Admin đã ready"
  );

  // ============================================================
  // 2. ĐỌC JOIN URL
  // ============================================================

  const data = JSON.parse(
    fs.readFileSync(
      JOIN_URL_FILE,
      "utf-8"
    )
  );

  const joinUrl = data.joinUrl;

  expect(
    joinUrl,
    "join-url.json không có joinUrl"
  ).toBeTruthy();

  console.log(
    "User - Join URL:",
    joinUrl
  );

  // ============================================================
  // 3. MỞ JOIN URL
  // ============================================================

  await page.goto(joinUrl, {
    waitUntil: "domcontentloaded",
  });

  console.log(
    "User - Đã mở Join URL"
  );

  // ============================================================
  // 4. NHẬP TÊN
  // ============================================================

  const nameInput =
    page.getByRole("textbox", {
      name: "Họ và tên *",
    });

  await expect(nameInput).toBeVisible({
    timeout: 30_000,
  });

  await nameInput.fill("Devtest");

  // ============================================================
  // 5. CLICK THAM GIA
  // ============================================================

  const joinButton =
    page.getByRole("button", {
      name: "Tham gia",
    });

  await expect(joinButton).toBeEnabled({
    timeout: 10_000,
  });

  await joinButton.click();

  console.log(
    "User - Đã click Tham gia"
  );

  // ============================================================
  // 6. CHỜ URL THAY ĐỔI
  // ============================================================

  await expect
    .poll(
      () => page.url(),
      {
        timeout: 30_000,
        intervals: [200, 500, 1000],
      }
    )
    .not.toBe(joinUrl);

  console.log(
    "User - URL sau khi click:",
    page.url()
  );

  // ============================================================
  // 7. BÁO CHO ADMIN REQUEST
  // ============================================================

  fs.writeFileSync(
    USER_REQUESTED_FILE,
    JSON.stringify(
      {
        requested: true,
        requestedAt:
          new Date().toISOString(),
      },
      null,
      2
    ),
    "utf-8"
  );

  console.log(
    "User - Đã báo request cho Admin"
  );

  // ============================================================
  // 8. CHỜ ADMIN APPROVE
  // ============================================================

  await expect
    .poll(
      () => page.url(),
      {
        timeout: 60_000,
        intervals: [200, 500, 1000],
      }
    )
    .toContain("/room");

  console.log(
    "User - Đã vào phòng"
  );
  await page.waitForTimeout(5_000);

  console.log("User - Đã ở trong phòng 5 giây");
  // ============================================================
  // 9. RESET JOIN URL
  // ============================================================

  fs.writeFileSync(
    JOIN_URL_FILE,
    JSON.stringify({}, null, 2),
    "utf-8"
  );

  console.log(
    "User - Đã reset join-url.json"
  );

  // ============================================================
  // 10. USER PASS
  // ============================================================

  console.log(
    "User - Test passed"
  );
});