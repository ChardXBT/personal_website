import { access, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const canonicalOrigin = "https://ericsong.tech";
const canonicalUrl = `${canonicalOrigin}/`;

const [html, headers, robots, sitemap, redirects, introSource] = await Promise.all([
  readFile(join(repositoryRoot, "index.html"), "utf8"),
  readFile(join(repositoryRoot, "_headers"), "utf8"),
  readFile(join(repositoryRoot, "robots.txt"), "utf8"),
  readFile(join(repositoryRoot, "sitemap.xml"), "utf8"),
  readFile(join(repositoryRoot, "_redirects"), "utf8"),
  readFile(join(repositoryRoot, "assets", "js", "intro.js"), "utf8")
]);

function assertIndexing(condition, message) {
  if (!condition) throw new Error(`Invalid indexing signal: ${message}`);
}

function parseHeaderRules(source) {
  const rules = new Map();
  let currentPath = null;

  for (const rawLine of source.split(/\r?\n/)) {
    if (!rawLine.trim()) continue;
    if (!/^\s/.test(rawLine)) {
      currentPath = rawLine.trim();
      if (!rules.has(currentPath)) rules.set(currentPath, new Map());
      continue;
    }

    const separator = rawLine.indexOf(":");
    if (!currentPath || separator < 0) continue;
    const name = rawLine.slice(0, separator).trim().toLowerCase();
    const value = rawLine.slice(separator + 1).trim();
    rules.get(currentPath).set(name, value);
  }

  return rules;
}

function extractJsonLdNodes(source) {
  return [...source.matchAll(
    /<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )].flatMap(([, json]) => {
    const document = JSON.parse(json);
    return Array.isArray(document?.["@graph"]) ? document["@graph"] : [document];
  });
}

function extractInternalReferences(source) {
  const values = [...source.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)].map(([, value]) => value);
  return values.flatMap((value) => {
    if (/^(?:mailto:|tel:|data:|javascript:|#)/i.test(value)) return [];
    const url = new URL(value, canonicalUrl);
    return url.origin === canonicalOrigin ? [{ source: value, url }] : [];
  });
}

const canonical = html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["']([^"']+)["']/i)?.[1];
assertIndexing(canonical === canonicalUrl, `canonical URL must be ${canonicalUrl}.`);

const rootCacheControl = parseHeaderRules(headers).get("/")?.get("cache-control") || "";
assertIndexing(
  rootCacheControl.split(",").map((directive) => directive.trim().toLowerCase()).includes("no-transform"),
  "the root response must include Cache-Control: no-transform so Cloudflare cannot inject crawlable email-protection URLs."
);

assertIndexing(
  !html.includes("/cdn-cgi/l/email-protection"),
  "source HTML must not advertise Cloudflare's email-protection endpoint."
);
assertIndexing(!html.includes("/?replay=1"), "source HTML must not advertise the replay query URL.");
assertIndexing(
  /<a\b[^>]*\bdata-replay-intro\b[^>]*\bhref=["']\/["']/i.test(html)
    || /<a\b[^>]*\bhref=["']\/["'][^>]*\bdata-replay-intro\b/i.test(html),
  "the replay control must use the canonical root URL as its fallback."
);
assertIndexing(!introSource.includes('location.assign("/?replay=1")'), "replay must not navigate to a query URL.");
assertIndexing(
  introSource.includes('clearPlayedInThisTab(sessionStorage, win);') && introSource.includes('win.location.assign("/");'),
  "replay must clear the tab marker before reloading the canonical URL."
);

const profilePage = extractJsonLdNodes(html).find((node) => {
  const types = Array.isArray(node?.["@type"]) ? node["@type"] : [node?.["@type"]];
  return types.includes("ProfilePage");
});
assertIndexing(profilePage, "a ProfilePage JSON-LD node is required.");

const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, value]) => value.trim());
assertIndexing(
  sitemapUrls.length === 1 && sitemapUrls[0] === canonicalUrl,
  "the sitemap must contain only the canonical portfolio URL."
);
const sitemapLastModified = sitemap.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]?.trim();
assertIndexing(
  sitemapLastModified === profilePage.dateModified.slice(0, 10),
  "sitemap lastmod must match the ProfilePage dateModified calendar date."
);
assertIndexing(
  new RegExp(`^Sitemap:\\s*${canonicalUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}sitemap\\.xml\\s*$`, "mi").test(robots),
  "robots.txt must point to the canonical sitemap."
);

const references = extractInternalReferences(html);
const queryPageReferences = references.filter(({ url }) => {
  const extension = url.pathname.split("/").pop()?.includes(".");
  return url.search && !extension;
});
assertIndexing(
  queryPageReferences.length === 0,
  `internal HTML page links must not use query variants: ${queryPageReferences.map(({ source }) => source).join(", ")}`
);

const fileChecks = new Map();
for (const { url } of references) {
  let relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  if (!relativePath) relativePath = "index.html";
  if (relativePath.endsWith("/")) relativePath += "index.html";
  if (!fileChecks.has(relativePath)) {
    fileChecks.set(relativePath, access(join(repositoryRoot, relativePath)));
  }
}

const missingReferences = [];
for (const [relativePath, check] of fileChecks) {
  try {
    await check;
  } catch {
    missingReferences.push(relativePath);
  }
}
assertIndexing(
  missingReferences.length === 0,
  `internal references must resolve to repository files: ${missingReferences.join(", ")}`
);

for (const rawLine of redirects.split(/\r?\n/)) {
  const line = rawLine.trim();
  if (!line || line.startsWith("#")) continue;
  const [source, destination, status] = line.split(/\s+/);
  assertIndexing(/^\/(?!\/)/.test(source), `redirect source must be root-relative: ${source}`);
  assertIndexing(status === "301", `legacy redirect must be permanent: ${line}`);
  const destinationUrl = new URL(destination, canonicalUrl);
  let relativePath = decodeURIComponent(destinationUrl.pathname).replace(/^\/+/, "");
  if (!relativePath) relativePath = "index.html";
  await access(join(repositoryRoot, relativePath));
}

console.log(`Indexing signals are valid (${references.length} internal references, ${fileChecks.size} files checked).`);
