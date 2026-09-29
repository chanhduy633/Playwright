import { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly loginLink: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(private page: Page) {
    this.loginLink = page.getByRole("link", {
      name: "Đăng nhập",
    });

    this.usernameInput = page.locator("#input-username");

    this.passwordInput = page.locator("#input-password");

    this.loginButton = page.getByRole("button", {
      name: "Đăng nhập",
    });
  }

  async goto() {
    const baseUrl = process.env.APP_BASE_URL;

    if (!baseUrl) {
      throw new Error("APP_BASE_URL is not configured");
    }

    await this.page.goto(baseUrl);
  }

  async openLoginPage() {
    await this.loginLink.click();
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}