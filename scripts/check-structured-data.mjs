import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = join(repositoryRoot, "index.html");
const html = await readFile(indexPath, "utf8");
const jsonLdBlocks = [...html.matchAll(
  /<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
)];

function assertStructuredData(condition, message) {
  if (!condition) throw new Error(`Invalid structured data: ${message}`);
}

assertStructuredData(jsonLdBlocks.length > 0, "index.html must contain JSON-LD.");

const nodes = jsonLdBlocks.flatMap(([, source], index) => {
  let document;
  try {
    document = JSON.parse(source);
  } catch (error) {
    throw new Error(`Invalid JSON-LD block ${index + 1}: ${error.message}`);
  }
  return Array.isArray(document?.["@graph"]) ? document["@graph"] : [document];
});

const profilePage = nodes.find((node) => {
  const types = Array.isArray(node?.["@type"]) ? node["@type"] : [node?.["@type"]];
  return types.includes("ProfilePage");
});

assertStructuredData(profilePage, "a ProfilePage node is required.");
assertStructuredData(profilePage.mainEntity, "ProfilePage.mainEntity is required.");

const timezoneDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
for (const property of ["dateCreated", "dateModified"]) {
  const value = profilePage[property];
  assertStructuredData(
    typeof value === "string" && timezoneDateTime.test(value) && Number.isFinite(Date.parse(value)),
    `ProfilePage.${property} must be a valid ISO 8601 datetime with a timezone.`
  );
}

assertStructuredData(
  Date.parse(profilePage.dateModified) >= Date.parse(profilePage.dateCreated),
  "ProfilePage.dateModified cannot be earlier than dateCreated."
);

console.log("ProfilePage structured data is valid.");
