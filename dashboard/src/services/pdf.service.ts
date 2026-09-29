import jsPDF from "jspdf";
import type {
  PlaywrightResult,
  Spec,
} from "../types/playwright-result";
import {
  getTestResultData,
  getAttachments,
  pickImages,
  pickVideos,
  pickTraces,
} from "./test.service";

function formatDuration(ms: number) {
  return `${(ms / 1000).toFixed(2)}s`;
}

function getStatus(spec: Spec) {
  const result = getTestResultData(spec);

  if (!result) {
    return "UNKNOWN";
  }

  if (result.status === "passed") {
    return "PASSED";
  }

  if (result.status === "failed") {
    return "FAILED";
  }

  if (result.status === "skipped") {
    return "SKIPPED";
  }

  if (result.status === "timedOut") {
    return "TIMEOUT";
  }

  return result.status.toUpperCase();
}

function addText(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth = 180,
) {
  const lines = pdf.splitTextToSize(text, maxWidth);

  pdf.text(lines, x, y);

  return y + lines.length * 6;
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);

    image.onerror = () => {
      reject(new Error(`Không thể load image: ${url}`));
    };

    image.src = `${url}?t=${Date.now()}`;
  });
}

export async function exportTestReportPdf(
  result: PlaywrightResult,
  specs: Spec[],
) {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });


  const pageHeight = pdf.internal.pageSize.getHeight();

  let y = 20;

  // =========================
  // HEADER
  // =========================

  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");

  pdf.text("Playwright Test Report", 20, y);

  y += 10;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");

  pdf.text(
    `Generated: ${new Date().toLocaleString("vi-VN")}`,
    20,
    y,
  );

  y += 12;

  // =========================
  // SUMMARY
  // =========================

  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");

  pdf.text("Test Summary", 20, y);

  y += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");

  const { stats } = result;

  const total =
    stats.expected +
    stats.unexpected +
    stats.skipped +
    stats.flaky;

  const summary = [
    `Total: ${total}`,
    `Passed: ${stats.expected}`,
    `Failed: ${stats.unexpected}`,
    `Skipped: ${stats.skipped}`,
    `Flaky: ${stats.flaky}`,
    `Duration: ${formatDuration(stats.duration)}`,
    `Workers: ${result.config.workers}`,
    `Browser: Chromium`,
  ];

  for (const item of summary) {
    pdf.text(item, 20, y);
    y += 6;
  }

  y += 8;

  // =========================
  // TEST LIST
  // =========================

  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");

  pdf.text("Test Cases", 20, y);

  y += 8;

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");

  pdf.text("Test", 20, y);
  pdf.text("Status", 105, y);
  pdf.text("Worker", 135, y);
  pdf.text("Duration", 160, y);

  y += 5;

  pdf.setFont("helvetica", "normal");

  for (const spec of specs) {
    const testResult = getTestResultData(spec);

    if (!testResult) {
      continue;
    }

    if (y > pageHeight - 20) {
      pdf.addPage();
      y = 20;
    }

    const title = spec.title;
    const status = getStatus(spec);

    const worker = testResult.workerIndex ?? "-";

    const duration = formatDuration(
      testResult.duration ?? 0,
    );

    const titleLines = pdf.splitTextToSize(title, 80);

    pdf.text(titleLines, 20, y);
    pdf.text(status, 105, y);
    pdf.text(String(worker), 135, y);
    pdf.text(duration, 160, y);

    y += Math.max(titleLines.length * 5, 5);

    y += 4;
  }

  // =========================
  // DETAIL
  // =========================

  for (const spec of specs) {
    const testResult = getTestResultData(spec);

    if (!testResult) {
      continue;
    }

    pdf.addPage();

    y = 20;

    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");

    y = addText(
      pdf,
      spec.title,
      20,
      y,
      170,
    );

    y += 5;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");

    y = addText(
      pdf,
      `Status: ${getStatus(spec)}`,
      20,
      y,
    );

    y = addText(
      pdf,
      `Worker: ${testResult.workerIndex ?? "-"}`,
      20,
      y,
    );

    y = addText(
      pdf,
      `Parallel Index: ${testResult.parallelIndex ?? "-"}`,
      20,
      y,
    );

    y = addText(
      pdf,
      `Duration: ${formatDuration(
        testResult.duration ?? 0,
      )}`,
      20,
      y,
    );

    y += 5;

    // =========================
    // ATTACHMENTS
    // =========================

    const attachments = getAttachments(testResult);

    const images = pickImages(attachments);
    const videos = pickVideos(attachments);
    const traces = pickTraces(attachments);

    pdf.setFont("helvetica", "bold");

    pdf.text("Attachments", 20, y);

    y += 7;

    pdf.setFont("helvetica", "normal");

    pdf.text(
      `Screenshots: ${images.length}`,
      20,
      y,
    );

    y += 5;

    pdf.text(
      `Videos: ${videos.length}`,
      20,
      y,
    );

    y += 5;

    pdf.text(
      `Traces: ${traces.length}`,
      20,
      y,
    );

    y += 10;

    // =========================
    // ERROR
    // =========================

    if (
      testResult.error?.message ||
      testResult.errors?.length
    ) {
      pdf.setFont("helvetica", "bold");

      pdf.text("Error", 20, y);

      y += 7;

      pdf.setFont("helvetica", "normal");

      const error =
        testResult.error?.message ??
        testResult.errors?.[0]?.message ??
        "Unknown error";

      y = addText(
        pdf,
        error,
        20,
        y,
        170,
      );

      y += 8;
    }

    // =========================
    // SCREENSHOT
    // =========================

    for (const image of images) {
      if (y > pageHeight - 80) {
        pdf.addPage();
        y = 20;
      }

      try {
        const img = await loadImage(image.url);

        const maxWidth = 170;
        const maxHeight = 100;

        const ratio =
          img.width / img.height;

        let width = maxWidth;
        let height = width / ratio;

        if (height > maxHeight) {
          height = maxHeight;
          width = height * ratio;
        }

        pdf.setFont("helvetica", "bold");

        pdf.text(
          image.name,
          20,
          y,
        );

        y += 5;

        pdf.addImage(
          img,
          "PNG",
          20,
          y,
          width,
          height,
        );

        y += height + 10;
      } catch (error) {
        console.error(
          "Không thể thêm screenshot vào PDF:",
          error,
        );

        pdf.setFont("helvetica", "normal");

        pdf.text(
          `Không thể load screenshot: ${image.name}`,
          20,
          y,
        );

        y += 7;
      }
    }
  }

  // =========================
  // SAVE
  // =========================

  const fileName = `playwright-report-${Date.now()}.pdf`;

  pdf.save(fileName);
}