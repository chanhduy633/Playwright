import { test, expect } from "@playwright/test";
import { ChatPage } from "../page/chat.page";

test("2 users send and receive chat message", async ({ browser }) => {
  const userAUrl = process.env.APP_USER_A_URL;
  const userBUrl = process.env.APP_USER_B_URL;

  if (!userAUrl || !userBUrl) {
    throw new Error(
      "APP_USER_A_URL and APP_USER_B_URL must be configured in .env",
    );
  }

  // ==========================
  // USER A
  // ==========================

  const contextA = await browser.newContext({
    recordVideo: {
      dir: "test-results",
    },
  });

  const pageA = await contextA.newPage();

  const chatA = new ChatPage(pageA);

  await chatA.goto(userAUrl);

  await chatA.connectMeeting();

  await chatA.openChat();

  // ==========================
  // USER B
  // ==========================

  const contextB = await browser.newContext({
    recordVideo: {
      dir: "test-results/videos",
    },
  });

  const pageB = await contextB.newPage();

  const chatB = new ChatPage(pageB);

  await chatB.goto(userBUrl);

  await chatB.connectMeeting();

  await chatB.openChat();

  // ==========================
  // USER A SEND MESSAGE
  // ==========================

  const message = `Hello User B ${Date.now()}`;

  await chatA.sendMessage(message);

  // ==========================
  // USER B RECEIVE MESSAGE
  // ==========================

  await chatB.expectMessageReceived(message);

  // ==========================
  // SCREENSHOT
  // ==========================

  await pageA.screenshot({
    path: "test-results/user-a-chat.png",
    fullPage: true,
  });

  await pageB.screenshot({
    path: "test-results/user-b-chat.png",
    fullPage: true,
  });

  // ==========================
  // CLOSE
  // ==========================

  await contextA.close();
  await contextB.close();
});