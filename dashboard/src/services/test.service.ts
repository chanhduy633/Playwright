import type {
  PlaywrightResult,
  Spec,
  Suite,
  TestResult,
  UiAttachment,
} from "../types/playwright-result";

export async function getTestResult(): Promise<PlaywrightResult> {
  const res = await fetch(`/result.json?t=${Date.now()}`);
  if (!res.ok) throw new Error("Không thể đọc result.json");
  return res.json();
}

/** Đệ quy lấy hết specs, kể cả suite lồng nhau */
export function flattenSpecs(result: PlaywrightResult): Spec[] {
  const walk = (suites: Suite[] = []): Spec[] =>
    suites.flatMap((s) => [...(s.specs ?? []), ...walk(s.suites)]);
  return walk(result.suites);
}

export function getTestResultData(spec: Spec): TestResult | undefined {
  const tests = spec.tests ?? [];
  const results = tests[tests.length - 1]?.results ?? [];
  return results[results.length - 1];
}

/**
 * "D:\Workspace\...\Playwright\test-results\camera-send-xxx\test-finished-1.png"
 *   -> "/test-results/camera-send-xxx/test-finished-1.png"
 */
export function toUrl(absPath?: string): string | null {
  if (!absPath) return null;
  const norm = absPath.replace(/\\/g, "/");
  const i = norm.lastIndexOf("/test-results/");
  if (i === -1) return null;
  return norm
    .slice(i)
    .split("/")
    .map((seg, idx) => (idx === 0 ? seg : encodeURIComponent(seg)))
    .join("/");
}

export function getAttachments(result?: TestResult): UiAttachment[] {
  return (result?.attachments ?? [])
    .map((a) => ({
      name: a.name,
      contentType: a.contentType ?? "",
      url: toUrl(a.path) ?? "",
    }))
    .filter((a) => a.url !== "");
}

export const pickImages = (list: UiAttachment[]) =>
  list.filter((a) => a.contentType.startsWith("image/"));

export const pickVideos = (list: UiAttachment[]) =>
  list.filter((a) => a.contentType.startsWith("video/"));

export const pickTraces = (list: UiAttachment[]) =>
  list.filter((a) => a.name === "trace" || a.url.endsWith(".zip"));

export function getErrorMessage(result?: TestResult): string | null {
  const raw = result?.error?.message ?? result?.errors?.[0]?.message;
  return raw
    ? raw.replace(new RegExp(`${String.fromCharCode(27)}\\[\\d+m`, "g"), "")
    : null;
}