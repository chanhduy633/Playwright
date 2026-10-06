import { test, expect } from "@playwright/test";
import fs from "fs";

test("User", async ({ page }) => {
  test.setTimeout(60_000);

  // Chờ Admin tạo Join URL
  await expect
    .poll(
      () => fs.existsSync("join-url.json"),
      {
        timeout: 60_000,
        intervals: [500],
      }
    )
    .toBe(true);

  const { joinUrl } = JSON.parse(
    fs.readFileSync("join-url.json", "utf-8")
  );

  console.log("User - Join URL:", joinUrl);

  // Mở Join URL
  await page.goto(joinUrl);

  await page
    .getByRole("textbox", {
      name: "Họ và tên *",
    })
    .fill("Devtest");

  // Click tham gia
  await page
    .getByRole("button", {
      name: "Tham gia",
    })
    .click();

  console.log("User - Đã click Tham gia");

  // Chờ UI xử lý sau khi click
  await page.waitForTimeout(2_000);

  console.log("User - URL sau khi click:", page.url());

  // Báo cho Admin rằng User đã gửi yêu cầu
  fs.writeFileSync(
    "user-requested.json",
    JSON.stringify({
      requested: true,
    }),
    "utf-8"
  );

  console.log("User - Đã gửi yêu cầu tham gia");

  // Chờ Admin xử lý request
  await expect
    .poll(
      () => page.url(),
      {
        timeout: 60_000,
        intervals: [500],
      }
    )
    .toContain("/room");

  console.log("User - Đã vào phòng");
  console.log("User - Test passed");
});