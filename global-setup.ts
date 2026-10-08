import fs from "fs";
import path from "path";

export default async function globalSetup() {
  const dir = path.resolve("test-data");

  fs.rmSync(dir, {
    recursive: true,
    force: true,
  });

  fs.mkdirSync(dir, {
    recursive: true,
  });

  const write = (file: string, data: unknown) =>
    fs.writeFileSync(
      path.join(dir, file),
      JSON.stringify(data, null, 2),
      "utf-8",
    );

  write("join-url.json", {});

  write("admin-ready.json", {
    ready: false,
  });

  write("user-requested.json", {
    requested: false,
  });

  write("media-ready.json", {
    ready: false,
  });

  write("admin-verified.json", {
    verified: false,
  });
}
