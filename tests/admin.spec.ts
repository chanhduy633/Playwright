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
  if (fs.existsSync("join-url.json")) {
    fs.unlinkSync("join-url.json");
  }

  if (fs.existsSync("user-requested.json")) {
    fs.unlinkSync("user-requested.json");
  }

  await page.goto(env.APP_LOGIN_URL);

  await page
    .getByRole("textbox", { name: "Tài khoản" })
    .fill(env.APP_USERNAME);

  await page
    .getByRole("textbox", { name: "Mật khẩu" })
    .fill(env.APP_PASSWORD);

  await page.getByRole("button", { name: "Đăng nhập" }).click();

  const page1Promise = page.waitForEvent("popup");

  await page
    .getByRole("button", {
      name: "lightning charge Tạo nhanh cu",
    })
    .click();

  const page1 = await page1Promise;

  await page1.getByRole("button", {
    name: "Sao chép",
  }).click();

  const tooltipText = await page1
    .locator("#tippy-1")
    .innerText();

  const match = tooltipText.match(
    /https:\/\/gomesainterk06\.vnpt\.vn\/app\/#\/join\/[a-zA-Z0-9]+(\?accessCode=[a-zA-Z0-9]+)?/
  );

  if (!match) {
    throw new Error("Không tìm thấy Join URL");
  }

  const joinUrl = match[0];

  console.log("Admin - Join URL:", joinUrl);

  fs.writeFileSync(
    "join-url.json",
    JSON.stringify({ joinUrl }),
    "utf-8"
  );

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

  // Chờ request hiển thị trên UI
  await expect(
    page1.getByRole("button", {
      name: "Có 1 yêu cầu tham gia ",
    })
  ).toBeVisible({
    timeout: 60_000,
  });

  console.log("Admin - Request đã xuất hiện");

  await page1
    .getByRole("button", {
      name: "Có 1 yêu cầu tham gia ",
    })
    .click();

  console.log("Admin - Đã mở danh sách yêu cầu");

  await page1.getByTitle("Cho phép").click();

  console.log("Admin - Đã cho phép User tham gia");

  await page1
    .getByRole("button", {
      description: "Kết thúc cuộc họp?",
      exact: true,
    })
    .click();

  await page1.getByRole("button", {
    name: "Kết thúc cuộc họp",
  }).click();

  const downloadPromise = page1.waitForEvent("download");

  await page1.getByRole("button", {
    name: "Kết thúc",
  }).click();

  const download = await downloadPromise;

  fs.mkdirSync("downloads", {
    recursive: true,
  });

  await download.saveAs(
    `downloads/${download.suggestedFilename()}`
  );

  console.log("Admin - Test passed");
});
