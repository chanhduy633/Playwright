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

  console.log("Worker 2 - Join URL:", joinUrl);

  await page.goto(joinUrl);

  await page
    .getByRole("textbox", { name: "Họ và tên *" })
    .fill("Devtest");

  await page
    .getByRole("button", { name: "Tham gia" })
    .click();

  fs.writeFileSync("user-joined.json", "true", "utf-8");

  const micButton = page.getByRole("button", {
    description: "Bật/Tắt Mic",
    exact: true,
  });

  const cameraButton = page.getByRole("button", {
    description: "Bật/Tắt Camera",
    exact: true,
  });

  await micButton.waitFor({
    state: "visible",
    timeout: 60_000,
  });

  await micButton.click();
  await cameraButton.click();
});