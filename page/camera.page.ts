import { Page, Locator } from "@playwright/test";

export class CameraPage {
  readonly joinAudioButton: Locator;
  readonly cameraButton: Locator;
  readonly videoElements: Locator;

  constructor(private page: Page) {
    this.joinAudioButton = page.locator("#join-audio-btn");

    // Button thứ 3
    this.cameraButton = page.locator("button.control-btn").nth(2);

    this.videoElements = page.locator("video");
  }

  async goto(url: string) {
    await this.page.goto(url, {
      waitUntil: "domcontentloaded",
    });
  }

  async connectMeeting() {
    if (await this.joinAudioButton.isVisible().catch(() => false)) {
      await this.joinAudioButton.click();

      await this.page.waitForTimeout(1000);
    }
  }

  async turnOnCamera() {
    await this.cameraButton.waitFor({
      state: "visible",
      timeout: 15000,
    });

    await this.cameraButton.click();

    await this.page.waitForTimeout(1000);
  }

  async expectCameraStream() {
    await this.page.waitForFunction(
      () => {
        const videos = Array.from(
          document.querySelectorAll("video"),
        ) as HTMLVideoElement[];

        return videos.some(
          (video) =>
            video.srcObject !== null &&
            video.videoWidth > 0 &&
            video.videoHeight > 0,
        );
      },
      undefined,
      {
        timeout: 30_000,
      },
    );
  }

  async expectRemoteCameraStream() {
    await this.page.waitForFunction(
      () => {
        const videos = Array.from(
          document.querySelectorAll("video"),
        ) as HTMLVideoElement[];

        return videos.some(
          (video) =>
            video.srcObject !== null &&
            video.videoWidth > 0 &&
            video.videoHeight > 0,
        );
      },
      undefined,
      {
        timeout: 30_000,
      },
    );
  }

  async debugVideos() {
    const videos = await this.videoElements.evaluateAll((elements) =>
      elements.map((element) => {
        const video = element as HTMLVideoElement;

        return {
          readyState: video.readyState,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          paused: video.paused,
          hasSrcObject: video.srcObject !== null,
        };
      }),
    );

    console.log("VIDEO STATUS:", videos);
  }
}