import { test, expect } from "@playwright/test";
import fs from "fs";

test("User", async ({ page }) => {
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

  await page.goto(joinUrl);

  await page
    .getByRole("textbox", { name: "Họ và tên *" })
    .fill("Devtest");

  await page
    .getByRole("button", { name: "Tham gia" })
    .click();

  // Chỉ báo cho Admin rằng User đã gửi request
  fs.writeFileSync(
    "user-requested.json",
    JSON.stringify({ requested: true }),
    "utf-8"
  );

  console.log("User - Đã gửi yêu cầu tham gia");

  const micButton = page.getByRole("button", {
    description: "Bật/Tắt Mic",
    exact: true,
  });

  const cameraButton = page.getByRole("button", {
    description: "Bật/Tắt Camera",
    exact: true,
  });

  // Chờ Admin cho phép User vào phòng
  await micButton.waitFor({
    state: "visible",
    timeout: 60_000,
  });

  console.log("User - Đã được Admin cho phép vào phòng");

  await micButton.click();
  await cameraButton.click();

  console.log("User - Test passed");
});
