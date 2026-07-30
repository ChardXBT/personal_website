import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, resolve } from "node:path";

import {
  DATA_COLLECTION_EVIDENCE,
  DATA_COLLECTION_PROJECTS,
  PROJECTS,
  REEL_ITEMS
} from "../content/site-content.js";

const REEL_START = "<!-- GENERATED_PROJECT_REEL_START -->";
const REEL_END = "<!-- GENERATED_PROJECT_REEL_END -->";
const SUMMARY_START = "<!-- GENERATED_BUILD_SUMMARY_START -->";
const SUMMARY_END = "<!-- GENERATED_BUILD_SUMMARY_END -->";
const LIST_START = "<!-- GENERATED_PROJECT_LIST_START -->";
const LIST_END = "<!-- GENERATED_PROJECT_LIST_END -->";
const NOSCRIPT_START = "<!-- GENERATED_NOSCRIPT_PROJECTS_START -->";
const NOSCRIPT_END = "<!-- GENERATED_NOSCRIPT_PROJECTS_END -->";
const DATA_COLLECTION_START = "<!-- GENERATED_DATA_COLLECTION_START -->";
const DATA_COLLECTION_END = "<!-- GENERATED_DATA_COLLECTION_END -->";
const VALID_STAT_KINDS = new Set([
  "exact cumulative",
  "verified lower bound",
  "estimated lifetime range",
  "current scope"
]);

function assertContent(condition, message) {
  if (!condition) throw new Error(`Invalid canonical content: ${message}`);
}

function assertUniqueIds(items, label) {
  const ids = items.map((item) => item.id);
  assertContent(ids.every(Boolean), `${label} require non-empty IDs.`);
  assertContent(new Set(ids).size === ids.length, `${label} IDs must be unique.`);
}

export function validateProjectContent() {
  assertContent(REEL_ITEMS.length === 6, "the kinetic reel must contain six phrases.");
  assertContent(PROJECTS.length === 5, "the selected-work list must contain five projects.");
  assertContent(DATA_COLLECTION_PROJECTS.length === 6, "Data Collection must contain six entries.");
  assertUniqueIds(PROJECTS, "Projects");
  assertUniqueIds(DATA_COLLECTION_PROJECTS, "Data Collection entries");
  assertContent(
    new Set(PROJECTS.map((project) => project.categoryLabel)).size === PROJECTS.length,
    "project category labels must be unique."
  );
  assertContent(
    REEL_ITEMS.slice(0, -1).every((label, index) => (
      label === `${PROJECTS[index].categoryLabel.toLowerCase()}.`
    )),
    "kinetic reel categories must match the selected-work category labels."
  );

  PROJECTS.forEach((project) => {
    ["categoryLabel", "label", "listMetric", "description", "provenance", "metric", "pitch"].forEach((field) => {
      assertContent(project[field], `${project.id}.${field} is required.`);
    });
    assertContent(Array.isArray(project.highlights), `${project.id}.highlights must be an array.`);
    assertContent(Array.isArray(project.stack), `${project.id}.stack must be an array.`);
    assertContent(Array.isArray(project.links), `${project.id}.links must be an array.`);
  });

  DATA_COLLECTION_PROJECTS.forEach((collector) => {
    ["label", "summary", "scope", "sourceLabel"].forEach((field) => {
      assertContent(collector[field], `${collector.id}.${field} is required.`);
    });
    const stat = collector.historicalStat;
    assertContent(stat && VALID_STAT_KINDS.has(stat.kind), `${collector.id} has an invalid statistic kind.`);
    ["display", "unit", "earliestDate", "period", "source", "method", "discount", "confidence"].forEach((field) => {
      assertContent(stat[field], `${collector.id}.historicalStat.${field} is required.`);
    });
    if (stat.kind === "verified lower bound") {
      assertContent(/\+|at least/i.test(stat.display), `${collector.id} lower bounds must be visibly qualified.`);
    }
    if (stat.kind === "estimated lifetime range") {
      assertContent(/^(est\.|estimated)/i.test(stat.display), `${collector.id} estimates must be visibly labeled.`);
    }
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function replaceGeneratedBlock(source, startMarker, endMarker, markup, lineEnding) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error(`Missing or invalid generated-content markers: ${startMarker}`);
  }
  const contentStart = start + startMarker.length;
  return `${source.slice(0, contentStart)}${lineEnding}${markup}${lineEnding}${source.slice(end)}`;
}

function renderLinks(links, lineEnding, indent) {
  if (!links?.length) return "";
  return links.map((link) => (
    `${indent}<a href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)} <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>`
  )).join(lineEnding);
}

export function renderProjectReel(lineEnding = "\n") {
  return REEL_ITEMS.map((label) => (
    `                    <span class="project-reel-word"><span class="project-reel-glyph">${escapeHtml(label)}</span></span>`
  )).join(lineEnding);
}

export function renderBuildSummary() {
  const categories = PROJECTS.map((project) => project.categoryLabel);
  return `                <p class="build-categories-summary">${escapeHtml(categories.join(" · "))}</p>`;
}

export function renderProjectList(lineEnding = "\n") {
  return PROJECTS.map((project) => (
    `                <a class="project-word" href="${escapeHtml(project.fallbackHref || `#noscript-${project.id}`)}" data-project="${escapeHtml(project.id)}" aria-haspopup="dialog" aria-controls="project-detail" aria-expanded="false">${lineEnding}`
    + `                  <span>${escapeHtml(project.categoryLabel)}</span><small>${escapeHtml(project.listMetric)}</small>${lineEnding}`
    + "                </a>"
  )).join(lineEnding);
}

function renderEvidenceStrip(lineEnding, indent) {
  return DATA_COLLECTION_EVIDENCE.map((item) => [
    `${indent}<div>`,
    `${indent}  <dt>${escapeHtml(item.label)}</dt>`,
    `${indent}  <dd>${escapeHtml(item.kind)}</dd>`,
    `${indent}</div>`
  ].join(lineEnding)).join(lineEnding);
}

function renderCollectorList(lineEnding, indent) {
  return DATA_COLLECTION_PROJECTS.map((collector) => [
    `${indent}<li>`,
    `${indent}  <article class="collector-entry" id="collector-${escapeHtml(collector.id)}">`,
    `${indent}    <div class="collector-heading">`,
    `${indent}      <h4>${escapeHtml(collector.label)}</h4>`,
    `${indent}      <p class="collector-stat"><strong>${escapeHtml(collector.historicalStat.display)}</strong><span>${escapeHtml(collector.historicalStat.kind)}</span></p>`,
    `${indent}    </div>`,
    `${indent}    <p class="collector-summary">${escapeHtml(collector.summary)}</p>`,
    `${indent}    <p class="collector-scope">${escapeHtml(collector.scope)}</p>`,
    `${indent}    <p class="collector-source">${escapeHtml(collector.sourceLabel)}</p>`,
    `${indent}  </article>`,
    `${indent}</li>`
  ].join(lineEnding)).join(lineEnding);
}

export function renderDataCollectionSection(lineEnding = "\n") {
  return [
    '        <section class="section data-collection-section" id="data-collection" aria-labelledby="data-collection-title">',
    '          <h3 class="section-title" id="data-collection-title" tabindex="-1">Data Collection</h3>',
    '          <div class="data-collection-body">',
    '            <p class="data-collection-intro">Six focused collectors turn social posts and marketplace listings into normalized, reviewable signals.</p>',
    '            <dl class="collection-evidence" aria-label="Data collection evidence">',
    renderEvidenceStrip(lineEnding, "              "),
    '            </dl>',
    '            <ol class="collector-list">',
    renderCollectorList(lineEnding, "              "),
    '            </ol>',
    '          </div>',
    '        </section>'
  ].join(lineEnding);
}

export function renderNoscriptProjects(lineEnding = "\n") {
  const projects = PROJECTS.filter((project) => project.type !== "collection").map((project) => {
    const stack = project.stack.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    const highlights = project.highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    return [
      `          <article class="noscript-project" id="noscript-${escapeHtml(project.id)}">`,
      `            <p class="noscript-project-provenance">${escapeHtml(project.provenance)}</p>`,
      `            <h3>${escapeHtml(project.label)}</h3>`,
      `            <p class="noscript-project-summary">${escapeHtml(project.description)}</p>`,
      `            <p class="noscript-project-metric">${escapeHtml(project.metric)} <small>${escapeHtml(project.metricNote)}</small></p>`,
      `            <p class="noscript-project-pitch">${escapeHtml(project.pitch)}</p>`,
      `            <ul class="noscript-project-highlights" aria-label="Project highlights">${highlights}</ul>`,
      `            <ul class="noscript-stack" aria-label="Technologies used">${stack}</ul>`,
      '            <nav class="noscript-project-links" aria-label="Project links">',
      renderLinks(project.links, lineEnding, "              "),
      "            </nav>",
      "          </article>"
    ].join(lineEnding);
  }).join(lineEnding);

  return [
    '        <section class="noscript-projects" aria-labelledby="noscript-projects-title">',
    '          <h2 id="noscript-projects-title">Selected project details</h2>',
    projects,
    "        </section>"
  ].join(lineEnding);
}

export function renderProjectContent(source) {
  const lineEnding = source.includes("\r\n") ? "\r\n" : "\n";
  const blocks = [
    [REEL_START, REEL_END, renderProjectReel(lineEnding)],
    [SUMMARY_START, SUMMARY_END, renderBuildSummary()],
    [LIST_START, LIST_END, renderProjectList(lineEnding)],
    [DATA_COLLECTION_START, DATA_COLLECTION_END, renderDataCollectionSection(lineEnding)],
    [NOSCRIPT_START, NOSCRIPT_END, renderNoscriptProjects(lineEnding)]
  ];
  return blocks.reduce(
    (rendered, [start, end, markup]) => replaceGeneratedBlock(rendered, start, end, markup, lineEnding),
    source
  );
}

export async function syncProjectContent({ check = false } = {}) {
  validateProjectContent();
  const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const indexPath = join(repositoryRoot, "index.html");
  const source = await readFile(indexPath, "utf8");
  const rendered = renderProjectContent(source);
  if (rendered === source) return { changed: false, indexPath };
  if (check) throw new Error("index.html project content is out of sync. Run `npm run content:sync`.");
  await writeFile(indexPath, rendered, "utf8");
  return { changed: true, indexPath };
}

const isMain = process.argv[1]
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  const check = process.argv.includes("--check");
  syncProjectContent({ check })
    .then(({ changed }) => {
      console.log(changed ? "Synced project content." : "Project content is already in sync.");
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
