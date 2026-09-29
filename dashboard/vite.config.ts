import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";

// Thư mục Playwright cha (dashboard/..)
const ROOT = path.resolve(__dirname, "..");

function playwrightAssets(): Plugin {
  return {
    name: "playwright-assets",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url || "").split("?")[0]);

        let filePath: string | null = null;

        if (url === "/result.json") {
          filePath = path.join(ROOT, "result.json");
        } else if (url.startsWith("/test-results/")) {
          filePath = path.join(ROOT, url);
        }

        if (!filePath) return next();

        // chặn path traversal
        if (!filePath.startsWith(ROOT)) {
          res.statusCode = 403;
          return res.end("Forbidden");
        }

        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
          res.statusCode = 404;
          return res.end("Not found");
        }

        const ext = path.extname(filePath).toLowerCase();
        const mime: Record<string, string> = {
          ".json": "application/json",
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".webm": "video/webm",
          ".mp4": "video/mp4",
          ".zip": "application/zip",
          ".txt": "text/plain",
          ".md": "text/markdown",
        };

        res.setHeader("Content-Type", mime[ext] || "application/octet-stream");
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Access-Control-Allow-Origin", "*");

        fs.createReadStream(filePath).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), playwrightAssets()],
  publicDir: false,
  server: { port: 5173 },
});