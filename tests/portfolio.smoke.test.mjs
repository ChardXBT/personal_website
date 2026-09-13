import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PROJECTS,
  REEL_ITEMS,
  DATA_COLLECTION_PROJECTS
} from "../content/site-content.js";
import {
  validateProjectContent,
  renderProjectContent,
  renderNoscriptProjects
} from "../scripts/sync-project-content.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readRepoFile = (relativePath) => readFile(join(repoRoot, relativePath), "utf8");

test("canonical content passes its own validation contract", () => {
  assert.doesNotThrow(() => validateProjectContent());
});

test("index.html generated blocks are in sync with the content module", async () => {
  const html = await readRepoFile("index.html");
  assert.equal(
    renderProjectContent(html),
    html,
    "index.html is out of sync — run `npm run content:sync`."
  );
});

test("noscript projects never emit an empty <nav> landmark", async () => {
  const html = await readRepoFile("index.html");
  // An empty links nav would look like: <nav ...>\n\n            </nav>
  assert.ok(
    !/<nav class="noscript-project-links"[^>]*>\s*<\/nav>/.test(html),
    "found an empty noscript-project-links <nav>"
  );

  // Generator-level guarantee: a project with no links must not render a nav.
  const withoutLinks = renderNoscriptProjects("\n");
  const linkless = PROJECTS.filter((p) => p.type !== "collection" && (!p.links || p.links.length === 0));
  for (const project of linkless) {
    const articleMatch = new RegExp(
      `<article class="noscript-project" id="noscript-${project.id}">[\\s\\S]*?</article>`
    ).exec(withoutLinks);
    assert.ok(articleMatch, `noscript article for ${project.id} should exist`);
    assert.ok(
      !articleMatch[0].includes("noscript-project-links"),
      `linkless project ${project.id} must not render a links nav`
    );
  }
});

test("every project link renders with safe external-link attributes", async () => {
  const html = await readRepoFile("index.html");
  for (const project of PROJECTS) {
    for (const link of project.links ?? []) {
      const anchor = new RegExp(
        `<a href="${link.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>`
      ).exec(html);
      assert.ok(anchor, `link ${link.href} should appear in generated HTML`);
      assert.match(anchor[0], /rel="noopener noreferrer"/);
      assert.match(anchor[0], /target="_blank"/);
    }
  }
});

test("Runway repository link is present in the generated noscript block", async () => {
  const html = await readRepoFile("index.html");
  assert.match(html, /id="noscript-runway"/);
  assert.match(html, /https:\/\/github\.com\/ChardXBT\/Runway/);
});

test("sitemap lastmod matches ProfilePage dateModified calendar date", async () => {
  const [html, sitemap] = await Promise.all([
    readRepoFile("index.html"),
    readRepoFile("sitemap.xml")
  ]);
  const jsonLd = [...html.matchAll(
    /<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )].flatMap(([, json]) => {
    const doc = JSON.parse(json);
    return Array.isArray(doc?.["@graph"]) ? doc["@graph"] : [doc];
  });
  const profilePage = jsonLd.find((node) => {
    const types = Array.isArray(node?.["@type"]) ? node["@type"] : [node?.["@type"]];
    return types.includes("ProfilePage");
  });
  assert.ok(profilePage, "ProfilePage JSON-LD node required");
  const lastmod = sitemap.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]?.trim();
  assert.equal(lastmod, profilePage.dateModified.slice(0, 10));
});

test("og:image reference resolves to an existing asset with a matching type", async () => {
  const html = await readRepoFile("index.html");
  const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  assert.ok(ogImage, "og:image meta tag required");
  const type = html.match(/<meta property="og:image:type" content="([^"]+)"/)?.[1];
  const path = new URL(ogImage).pathname.replace(/^\/+/, "");
  await assert.doesNotReject(
    access(join(repoRoot, decodeURIComponent(path))),
    `og:image file must exist at ${path}`
  );
  const expectedType = path.endsWith(".jpg") || path.endsWith(".jpeg")
    ? "image/jpeg"
    : path.endsWith(".png") ? "image/png" : null;
  assert.equal(type, expectedType, "og:image:type must match the file extension");
});

test("CSS cache-buster is identical across index.html and 404.html", async () => {
  const [index, notFound] = await Promise.all([
    readRepoFile("index.html"),
    readRepoFile("404.html")
  ]);
  const versionOf = (html) => html.match(/main\.css\?v=([^"']+)/)?.[1];
  assert.ok(versionOf(index), "index.html must reference main.css with a version");
  assert.equal(versionOf(notFound), versionOf(index), "404.html CSS version must match index.html");
});
