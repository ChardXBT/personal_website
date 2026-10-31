import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, isAbsolute, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".woff2": "font/woff2"
};

export function startPortfolioServer({ port = Number(process.env.PORT || 4173) } = {}) {
  const server = createServer(async (request, response) => {
    try {
      if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405, { "Allow": "GET, HEAD", "Content-Type": "text/plain; charset=utf-8" });
        response.end("Method not allowed");
        return;
      }

      const url = new URL(request.url, `http://${request.headers.host}`);
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.endsWith("/")) pathname += "index.html";
      const filePath = normalize(join(root, pathname.replace(/^\/+/, "")));
      const relativePath = relative(normalize(root), filePath);
      if (relativePath.startsWith("..") || isAbsolute(relativePath)) throw new Error("invalid path");
      const details = await stat(filePath);
      if (!details.isFile()) throw new Error("not a file");
      response.writeHead(200, {
        "Content-Type": types[extname(filePath).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "no-store"
      });
      if (request.method === "HEAD") {
        response.end();
        return;
      }
      createReadStream(filePath).pipe(response);
    } catch (_error) {
      try {
        const notFoundPath = join(root, "404.html");
        const details = await stat(notFoundPath);
        if (!details.isFile()) throw new Error("404 page is not a file");
        response.writeHead(404, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store"
        });
        if (request.method === "HEAD") {
          response.end();
          return;
        }
        createReadStream(notFoundPath).pipe(response);
      } catch (_fallbackError) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not found");
      }
    }
  });

  return new Promise((resolveServer, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      server.removeListener("error", reject);
      resolveServer(server);
    });
  });
}

const isDirect = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isDirect) {
  const port = Number(process.env.PORT || 4173);
  const server = await startPortfolioServer({ port });
  console.log(`Portfolio preview: http://127.0.0.1:${port}`);
  let closing = false;
  const shutdown = () => {
    if (closing) return;
    closing = true;
    server.closeAllConnections?.();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1000).unref();
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}
