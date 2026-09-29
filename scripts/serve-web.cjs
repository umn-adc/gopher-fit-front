// Local static preview with the production recovery headers. No analytics/scripts
// from other origins are allowed. The API origin comes from the build configuration.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = path.resolve("dist");
const apiOrigin = new URL(
  process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:3000",
).origin;
const recoveryHtml = fs.readFileSync(path.join(root, "recovery.html"), "utf8");
const hashes = [
  ...recoveryHtml.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g),
]
  .map(
    (m) =>
      `'sha256-${crypto.createHash("sha256").update(m[1]).digest("base64")}'`,
  )
  .join(" ");
const policy = `default-src 'self'; script-src 'self' ${hashes}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' ${apiOrigin}; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`;
const types = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".ico": "image/x-icon",
};
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(
    new URL(req.url, "http://localhost").pathname,
  );
  let file = path.resolve(root, "." + pathname);
  if (!file.startsWith(root + path.sep) && file !== root) {
    res.writeHead(403);
    res.end();
    return;
  }
  if (pathname === "/") file = path.join(root, "index.html");
  if (fs.existsSync(file) && fs.statSync(file).isDirectory())
    file = path.join(file, "index.html");
  else if (!fs.existsSync(file)) file = file.replace(/\/$/, "") + ".html";
  if (!fs.existsSync(file)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  res.writeHead(200, {
    "Content-Type": types[path.extname(file)] || "application/octet-stream",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": policy,
    "Cache-Control": "no-store",
  });
  fs.createReadStream(file).pipe(res);
});
server.listen(8081, "127.0.0.1", () =>
  console.log("Static preview: http://127.0.0.1:8081"),
);
