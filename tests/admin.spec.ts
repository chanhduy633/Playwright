import { test, expect } from "@playwright/test";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const env = {
  APP_USERNAME: process.env.APP_USERNAME!,
  APP_PASSWORD: process.env.APP_PASSWORD!,
  APP_LOGIN_URL: process.env.APP_LOGIN_URL!,
};

test("Admin", async ({ page }) => {
  test.setTimeout(60_000);

  // Xóa file cũ
  if (fs.existsSync("join-url.json")) {
    fs.unlinkSync("join-url.json");
  }

  if (fs.existsSync("user-requested.json")) {
    fs.unlinkSync("user-requested.json");
  }

  // Login
  await page.goto(env.APP_LOGIN_URL);

  await page
    .getByRole("textbox", { name: "Tài khoản" })
    .fill(env.APP_USERNAME);

  await page
    .getByRole("textbox", { name: "Mật khẩu" })
    .fill(env.APP_PASSWORD);

  await page
    .getByRole("button", { name: "Đăng nhập" })
    .click();

  // Tạo meeting
  const page1Promise = page.waitForEvent("popup");

  await page
    .getByRole("button", {
      name: "lightning charge Tạo nhanh cu",
    })
    .click();

  const page1 = await page1Promise;

  // Copy Join URL
  await page1
    .getByRole("button", {
      name: "Sao chép",
    })
    .click();

  const tooltipText = await page1
    .locator("#tippy-1")
    .innerText();

  const match = tooltipText.match(
    /https?:\/\/gomesainterk06\.vnpt\.vn\/app\/#\/join\/[a-zA-Z0-9]+(\?accessCode=[a-zA-Z0-9]+)?/
  );

  if (!match) {
    throw new Error("Không tìm thấy Join URL");
  }

  const joinUrl = match[0];

  console.log("Admin - Join URL:", joinUrl);

  // Ghi Join URL cho User worker
  fs.writeFileSync(
    "join-url.json",
    JSON.stringify({ joinUrl }),
    "utf-8"
  );

  // Reset thời gian chờ
  await page1
    .getByRole("button", {
      name: "Đặt lại thời gian chờ",
    })
    .click();

  // Chờ User gửi request
  await expect
    .poll(
      () => fs.existsSync("user-requested.json"),
      {
        timeout: 60_000,
        intervals: [500],
      }
    )
    .toBe(true);

  console.log("Admin - User đã gửi yêu cầu");

  // Chờ request xuất hiện trên UI
  await expect(
    page1.getByRole("button", {
      name: "Có 1 yêu cầu tham gia ",
    })
  ).toBeVisible({
    timeout: 60_000,
  });

  console.log("Admin - Request đã xuất hiện");

  // Mở danh sách request
  await page1
    .getByRole("button", {
      name: "Có 1 yêu cầu tham gia ",
    })
    .click();

  console.log("Admin - Đã mở danh sách yêu cầu");

  // Cho phép User
  await page1.getByTitle("Cho phép").click();

  console.log("Admin - Đã cho phép User tham gia");
  console.log("Admin - Test passed");
});
