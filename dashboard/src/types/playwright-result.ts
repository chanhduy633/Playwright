export interface Attachment {
  name: string;
  contentType: string;
  path?: string;
  body?: string;
}

export interface TestResult {
  workerIndex: number;
  parallelIndex: number;
  status: string;
  duration: number;
  errors: { message?: string; stack?: string }[];
  error?: { message?: string; stack?: string };
  retry: number;
  startTime: string;
  stdout?: { text: string }[];
  stderr?: { text: string }[];
  attachments?: Attachment[];
}

export interface PlaywrightTest {
  timeout: number;
  expectedStatus: string;
  projectName?: string;
  results: TestResult[];
  status: string;
}

export interface Spec {
  title: string;
  ok: boolean;
  tags: string[];
  tests: PlaywrightTest[];
  id: string;
  file: string;
  line: number;
  column: number;
}

export interface Suite {
  title: string;
  file: string;
  column: number;
  line: number;
  specs: Spec[];
  suites?: Suite[];
}

export interface PlaywrightStats {
  startTime: string;
  duration: number;
  expected: number;
  skipped: number;
  unexpected: number;
  flaky: number;
}

export interface PlaywrightResult {
  config: { workers: number; projects: { id: string; name: string }[] };
  suites: Suite[];
  stats: PlaywrightStats;
  errors: unknown[];
}

/** Attachment đã chuẩn hoá để render */
export interface UiAttachment {
  name: string;
  contentType: string;
  url: string;
}