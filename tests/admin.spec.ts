import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const env = {
  APP_USERNAME: process.env.APP_USERNAME!,
  APP_PASSWORD: process.env.APP_PASSWORD!,
  APP_LOGIN_URL: process.env.APP_LOGIN_URL!,
};

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

test("Admin", async ({ page }) => {
  test.setTimeout(120_000);
  
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {
      recursive: true,
    });
  }
  // ============================================================
  // 1. RESET STATE
  // ============================================================

  // Không xóa join-url.json
  // Chỉ reset nội dung
  fs.writeFileSync(
    JOIN_URL_FILE,
    JSON.stringify({}, null, 2),
    "utf-8"
  );

  // Reset trạng thái Admin
  fs.writeFileSync(
    ADMIN_READY_FILE,
    JSON.stringify(
      {
        ready: false,
      },
      null,
      2
    ),
    "utf-8"
  );

  // Reset trạng thái User
  fs.writeFileSync(
    USER_REQUESTED_FILE,
    JSON.stringify(
      {
        requested: false,
      },
      null,
      2
    ),
    "utf-8"
  );

  console.log("Admin - Đã reset state");

  // ============================================================
  // 2. LOGIN
  // ============================================================

  await page.goto(env.APP_LOGIN_URL, {
    waitUntil: "domcontentloaded",
  });

  await page
    .getByRole("textbox", {
      name: "Tài khoản",
    })
    .fill(env.APP_USERNAME);

  await page
    .getByRole("textbox", {
      name: "Mật khẩu",
    })
    .fill(env.APP_PASSWORD);

  await page
    .getByRole("button", {
      name: "Đăng nhập",
    })
    .click();

  console.log("Admin - Đã login");

  // ============================================================
  // 3. TẠO MEETING
  // ============================================================

  const popupPromise = page.waitForEvent("popup");

  await page
    .getByRole("button", {
      name: "lightning charge Tạo nhanh cu",
    })
    .click();

  const meetingPage = await popupPromise;

  await meetingPage.waitForLoadState("domcontentloaded");

  console.log("Admin - Meeting đã được tạo");

  // ============================================================
  // 4. COPY JOIN URL
  // ============================================================

  await meetingPage
    .getByRole("button", {
      name: "Sao chép",
    })
    .click();

  const clipboardText = await meetingPage.evaluate(
    async () => {
      return await navigator.clipboard.readText();
    }
  );

  console.log(
    "Admin - Clipboard:",
    clipboardText
  );

  const match = clipboardText.match(
    /https?:\/\/gomesainterk06\.vnpt\.vn\/app\/#\/join\/[a-zA-Z0-9]+(\?accessCode=[a-zA-Z0-9]+)?/
  );

  if (!match) {
    throw new Error(
      `Không tìm thấy Join URL: ${clipboardText}`
    );
  }

  const joinUrl = match[0];

  console.log(
    "Admin - Join URL:",
    joinUrl
  );

  // ============================================================
  // 5. GHI JOIN URL MỚI
  // ============================================================

  fs.writeFileSync(
    JOIN_URL_FILE,
    JSON.stringify(
      {
        joinUrl,
        createdAt: new Date().toISOString(),
      },
      null,
      2
    ),
    "utf-8"
  );

  console.log(
    "Admin - Đã ghi Join URL mới"
  );

  // ============================================================
  // 6. RESET THỜI GIAN CHỜ
  // ============================================================

  await meetingPage
    .getByRole("button", {
      name: "Đặt lại thời gian chờ",
    })
    .click();

  console.log(
    "Admin - Đã reset thời gian chờ"
  );

  // ============================================================
  // 7. BÁO CHO USER:
  //    ADMIN ĐÃ SẴN SÀNG
  // ============================================================

  fs.writeFileSync(
    ADMIN_READY_FILE,
    JSON.stringify(
      {
        ready: true,
        joinUrl,
        readyAt: new Date().toISOString(),
      },
      null,
      2
    ),
    "utf-8"
  );

  console.log(
    "Admin - Đã báo READY cho User"
  );

  // ============================================================
  // 8. CHỜ USER GỬI REQUEST
  // ============================================================

  await expect
    .poll(
      () => {
        if (!fs.existsSync(USER_REQUESTED_FILE)) {
          return false;
        }

        try {
          const data = JSON.parse(
            fs.readFileSync(
              USER_REQUESTED_FILE,
              "utf-8"
            )
          );

          return data.requested === true;
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
    "Admin - User đã gửi request"
  );

  // ============================================================
  // 9. CHỜ REQUEST XUẤT HIỆN TRÊN UI
  // ============================================================

  const requestButton =
    meetingPage.getByRole("button", {
      name: "Có 1 yêu cầu tham gia ",
    });

  await expect(requestButton).toBeVisible({
    timeout: 60_000,
  });

  console.log(
    "Admin - Request đã xuất hiện"
  );

  // ============================================================
  // 10. MỞ REQUEST
  // ============================================================

  await requestButton.click();

  console.log(
    "Admin - Đã mở danh sách request"
  );

  // ============================================================
  // 11. APPROVE USER
  // ============================================================

  const allowButton =
    meetingPage.getByTitle("Cho phép");

  await expect(allowButton).toBeVisible({
    timeout: 10_000,
  });

  await allowButton.click();

  console.log(
    "Admin - Đã cho phép User"
  );

  // ============================================================
  // 12. ADMIN PASS
  // ============================================================

  console.log(
    "Admin - Test passed"
  );
});