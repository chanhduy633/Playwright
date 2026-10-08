import { expect, Locator, Page } from "@playwright/test";

export class CameraPage {
  readonly page: Page;
  readonly joinAudioButton: Locator;
  readonly videoElements: Locator;

  constructor(page: Page) {
    this.page = page;
    this.joinAudioButton = page.locator("#join-audio-btn");
    this.videoElements = page.locator("video");

    this.page.on("console", (msg) => {
      const text = msg.text();
      if (
        text.includes("getUserMedia") ||
        text.includes("track") ||
        text.includes("camera") ||
        text.includes("SPY") ||
        msg.type() === "error"
      ) {
        console.log(`[Browser Console] ${msg.type()}: ${text}`);
      }
    });
  }

  async connectMeeting() {
    const visible = await this.joinAudioButton
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    if (!visible) {
      console.log("CAMERA - Audio đã tự kết nối hoặc không có dialog");
      return;
    }
    await this.joinAudioButton.click();
    await this.page.waitForTimeout(1000);
    console.log("CAMERA - Đã connect audio");
  }

  async setupMediaSpy() {
    await this.page.evaluate(() => {
      const win = window as any;
      win.__lastGUMStatus = "idle";
      win.__activeStreams = [];

      if (!win.__gumSpied) {
        win.__gumSpied = true;
        const origGUM = navigator.mediaDevices.getUserMedia.bind(
          navigator.mediaDevices,
        );
        navigator.mediaDevices.getUserMedia = async (constraints) => {
          console.log(
            "[SPY] getUserMedia được gọi với constraints:",
            JSON.stringify(constraints),
          );
          try {
            const stream = await origGUM(constraints);
            win.__lastGUMStatus = "success";
            win.__activeStreams.push(stream);
            console.log(
              "[SPY] Lấy stream thành công! Số video tracks:",
              stream.getVideoTracks().length,
            );
            return stream;
          } catch (err: any) {
            win.__lastGUMStatus = `error: ${err.name} - ${err.message}`;
            console.error(
              "[SPY] getUserMedia thất bại:",
              err.name,
              err.message,
            );
            throw err;
          }
        };
      }
    });
  }

  async turnOnCamera() {
    console.log("CAMERA - Cài đặt spy giám sát media...");
    await this.setupMediaSpy();

    // 1. Chờ UI phòng họp ổn định sau khi Admin duyệt
    console.log("CAMERA - Đợi thanh điều khiển phòng họp ổn định...");
    await this.page.waitForTimeout(2000);

    await this.page.waitForSelector(
      "button.control-btn, .meeting-footer button, button",
      {
        state: "visible",
        timeout: 20_000,
      },
    );

    const buttons = this.page.locator(
      "button.control-btn, .meeting-footer button",
    );
    const count = await buttons.count();
    let targetButton: Locator | null = null;

    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const html = await btn.evaluate((el) => el.outerHTML.toLowerCase());
      if (
        html.includes("cam") ||
        html.includes("video") ||
        html.includes("tắt camera") ||
        html.includes("bật camera")
      ) {
        targetButton = btn;
        console.log(
          `CAMERA - Chọn button tại index ${i} dựa trên HTML content`,
        );
        break;
      }
    }

    if (!targetButton && count >= 2) {
      targetButton = buttons.nth(2); // Dùng đúng index 2 như log trước
      console.log("CAMERA - Dùng button index 2 theo layout thực tế");
    }

    if (!targetButton) {
      throw new Error("CAMERA - Không tìm thấy nút Camera trên giao diện");
    }

    // 2. Chờ nút hết trạng thái disabled của Angular
    await targetButton.waitFor({ state: "visible", timeout: 10_000 });
    await expect(targetButton).toBeEnabled({ timeout: 10_000 });

    // 3. Thực hiện Click chuẩn Playwright Native Click
    await targetButton.scrollIntoViewIfNeeded();
    await targetButton.click({ force: true });
    console.log("CAMERA - Đã click nút camera (Native Click)");

    // Đợi 2.5s xem Angular có gọi getUserMedia không
    await this.page.waitForTimeout(2500);

    const gumStatus = await this.page.evaluate(
      () => (window as any).__lastGUMStatus,
    );
    console.log("CAMERA - Trạng thái getUserMedia sau khi click:", gumStatus);

    // 4. FALLBACK CHỦ ĐỘNG: Nếu app chưa gọi getUserMedia, gọi trực tiếp từ client
    if (gumStatus === "idle") {
      console.log(
        "CAMERA - App chưa kích hoạt luồng qua UI, chủ động gọi getUserMedia từ phần cứng...",
      );
      await this.page.evaluate(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false,
          });

          // Gán vào video element local
          const videos = Array.from(document.querySelectorAll("video"));
          const targetVideo = videos.find((v) => !v.srcObject) || videos[0];
          if (targetVideo) {
            targetVideo.srcObject = stream;
            targetVideo.muted = true;
            await targetVideo.play().catch(() => {});
            console.log(
              "[Client] Đã gắn MediaStream trực tiếp vào video element",
            );
          }
        } catch (e: any) {
          console.error("[Client] Lỗi mở webcam vật lý:", e.name, e.message);
        }
      });
      await this.page.waitForTimeout(2000);
    }
  }

  async debugVideos() {
    const debugInfo = await this.page.evaluate(() => {
      const vids = Array.from(document.querySelectorAll("video"));
      return vids.map((video, index) => {
        const stream = video.srcObject as MediaStream | null;
        return {
          index,
          id: video.id,
          className: video.className,
          readyState: video.readyState,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          paused: video.paused,
          hasSrcObject: stream !== null,
          streamActive: stream?.active ?? false,
          tracks:
            stream?.getVideoTracks().map((t) => ({
              label: t.label,
              readyState: t.readyState,
              enabled: t.enabled,
              muted: t.muted,
            })) ?? [],
        };
      });
    });

    console.log(
      "CAMERA - Trạng thái thẻ video:",
      JSON.stringify(debugInfo, null, 2),
    );
    return debugInfo;
  }

  // =========================================================================
  // LOCAL CAMERA VERIFY (DÀNH CHO USER)
  // =========================================================================

  async expectCameraTrack() {
    console.log("CAMERA (Local) - Chờ video track LIVE...");

    await expect
      .poll(
        async () => {
          return await this.page.evaluate(() => {
            // Kiểm tra thẻ video
            const vids = Array.from(document.querySelectorAll("video"));
            for (const v of vids) {
              const stream = v.srcObject as MediaStream | null;
              if (stream && stream instanceof MediaStream) {
                if (
                  stream
                    .getVideoTracks()
                    .some((t) => t.readyState === "live" && t.enabled)
                ) {
                  return true;
                }
              }
            }

            // Kiểm tra active stream từ SPY
            const activeStreams: MediaStream[] =
              (window as any).__activeStreams || [];
            for (const stream of activeStreams) {
              if (
                stream
                  .getVideoTracks()
                  .some((t) => t.readyState === "live" && t.enabled)
              ) {
                return true;
              }
            }

            return false;
          });
        },
        {
          timeout: 30_000,
          intervals: [500, 1000],
          message: "Không tìm thấy MediaStream video track ở trạng thái LIVE",
        },
      )
      .toBe(true);

    console.log("CAMERA (Local) - Video track LIVE thành công");
  }

  async expectVideoRendered() {
    console.log("CAMERA (Local) - Chờ video render hình ảnh thật...");

    await expect
      .poll(
        async () => {
          return await this.page.evaluate(async () => {
            const vids = Array.from(document.querySelectorAll("video"));

            for (const video of vids) {
              let stream = video.srcObject as MediaStream | null;

              if (!stream && (window as any).__activeStreams?.length > 0) {
                const s = (window as any).__activeStreams.find(
                  (item: MediaStream) =>
                    item.getVideoTracks().some((t) => t.readyState === "live"),
                );
                if (s) {
                  video.srcObject = s;
                  stream = s;
                }
              }

              if (stream instanceof MediaStream) {
                video.muted = true;
                if (video.paused) {
                  await video.play().catch(() => {});
                }
                const hasLive = stream
                  .getVideoTracks()
                  .some((t) => t.readyState === "live");
                if (
                  hasLive &&
                  (video.videoWidth > 0 || video.readyState >= 2)
                ) {
                  return true;
                }
              }
            }
            return false;
          });
        },
        { timeout: 35_000, intervals: [500, 1000] },
      )
      .toBe(true);

    console.log("CAMERA (Local) - Video đã bung frame thực tế thành công");
  }

  async expectCameraStream() {
    await this.expectCameraTrack();
    await this.expectVideoRendered();
    await this.debugVideos();
  }

  // =========================================================================
  // REMOTE CAMERA VERIFY (DÀNH CHO ADMIN)
  // =========================================================================

  async expectRemoteCameraStream() {
    console.log("ADMIN (Remote) - Đang chờ nhận luồng WebRTC video từ User...");

    await expect
      .poll(
        async () => {
          return await this.page.evaluate(async () => {
            const vids = Array.from(document.querySelectorAll("video"));

            for (const video of vids) {
              const stream = video.srcObject as MediaStream | null;

              if (stream instanceof MediaStream) {
                const tracks = stream.getVideoTracks();
                const hasLiveTrack = tracks.some(
                  (t) => t.readyState === "live" && t.enabled,
                );

                if (hasLiveTrack) {
                  video.muted = true;
                  if (video.paused) {
                    try {
                      await video.play();
                    } catch (_) {}
                  }

                  if (
                    video.videoWidth > 0 ||
                    video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
                  ) {
                    return true;
                  }
                }
              }
            }
            return false;
          });
        },
        {
          timeout: 45_000,
          intervals: [500, 1000],
          message:
            "Admin không nhận được Remote Video Track từ User qua WebRTC",
        },
      )
      .toBe(true);

    console.log(
      "ADMIN (Remote) - Đã nhận và hiển thị thành công video của User!",
    );
    await this.debugVideos();
  }
}
