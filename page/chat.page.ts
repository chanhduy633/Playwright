import { Page, Locator } from "@playwright/test";

export class ChatPage {
  readonly joinAudioButton: Locator;
  readonly chatButton: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;

  constructor(private page: Page) {
    // Nút kết nối họp
    this.joinAudioButton = page.locator("#join-audio-btn");

    // Nút Chat - button thứ 6
    // Playwright index bắt đầu từ 0 nên button thứ 6 = nth(5)
    this.chatButton = page.locator("button.control-btn").nth(5);

    // Ô nhập tin nhắn
    this.messageInput = page.locator("#formmessage");

    // Nút gửi tin nhắn
    this.sendButton = this.messageInput
    .locator("xpath=..")
    .locator("button.send-btn");
  }

  async goto(url: string) {
    await this.page.goto(url, {
      waitUntil: "domcontentloaded",
    });
  }

  async connectMeeting() {
    if (await this.joinAudioButton.isVisible()) {
      await this.joinAudioButton.click();
    }
  }

  async openChat() {
    await this.chatButton.waitFor({
      state: "visible",
      timeout: 15000,
    });

    await this.chatButton.click();
  }

  async sendMessage(message: string) {
    await this.messageInput.waitFor({
      state: "visible",
      timeout: 15000,
    });

    await this.messageInput.fill(message);

    await this.sendButton.waitFor({
      state: "visible",
      timeout: 15000,
    });

    await this.sendButton.click();
  }

  async expectMessageReceived(message: string) {
    await this.page
      .getByText(message, { exact: true })
      .waitFor({
        state: "visible",
        timeout: 15000,
      });
  }
}