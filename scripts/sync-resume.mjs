import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// The site links to exactly one resume, at one stable path. Whatever PDF you
// drop into documents/resume/ becomes that resume: this script renames it to
// the canonical filename and stamps the link with a hash of the file's bytes,
// so a replaced resume always arrives at a URL no browser or CDN has cached.
const RESUME_DIRECTORY = "documents/resume";
const ARCHIVE_DIRECTORY = `${RESUME_DIRECTORY}/archive`;
const OTHER_DIRECTORY = "documents/other-documents";
const CANONICAL_FILE = "eric-song-resume.pdf";
const CANONICAL_PATH = `/${RESUME_DIRECTORY}/${CANONICAL_FILE}`;
const STAMP_LENGTH = 12;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const RESUME_LINK = new RegExp(
  `(href=")(${escapeRegExp(CANONICAL_PATH)})(\\?[^"]*)?(")`,
  "g"
);

function assertResume(condition, message) {
  if (!condition) throw new Error(`Invalid resume state: ${message}`);
}

function git(repositoryRoot, args) {
  try {
    return execFileSync("git", args, {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return "";
  }
}

// Commit timestamps only have one-second resolution, so rank by position in
// history instead: two PDFs are genuinely ambiguous only when the same commit
// introduced both. A file with no commit yet is the one you just added, so it
// sorts ahead of everything in history.
function historyRank(repositoryRoot, relativePath, order) {
  const commit = git(repositoryRoot, ["log", "-1", "--format=%H", "--", relativePath]);
  const position = commit ? order.indexOf(commit) : -1;
  return { commit: commit || null, position: position < 0 ? -1 : position };
}

export function chooseResume(candidates, readRank) {
  assertResume(
    candidates.length > 0,
    `${RESUME_DIRECTORY}/ contains no PDF. Add your resume there.`
  );
  if (candidates.length === 1) return { chosen: candidates[0], superseded: [] };

  const ranked = candidates
    .map((name) => ({ name, ...readRank(name) }))
    .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));

  const tied = ranked.filter((entry) => (
    entry.position === ranked[0].position && entry.commit === ranked[0].commit
  ));
  assertResume(
    tied.length === 1,
    `${RESUME_DIRECTORY}/ has several PDFs from the same commit, so the newest one is ambiguous: `
      + `${tied.map((entry) => entry.name).join(", ")}. Keep one and commit again.`
  );

  return { chosen: ranked[0].name, superseded: ranked.slice(1).map((entry) => entry.name) };
}

export function stampResumeLink(html, stamp) {
  let matches = 0;
  const stamped = html.replace(RESUME_LINK, (_whole, before, path, _query, after) => {
    matches += 1;
    return `${before}${path}?v=${stamp}${after}`;
  });
  assertResume(matches > 0, `index.html no longer links to ${CANONICAL_PATH}.`);
  return stamped;
}

export async function syncResume({ check = false } = {}) {
  const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const resumeDirectory = join(repositoryRoot, RESUME_DIRECTORY);
  const entries = await readdir(resumeDirectory, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile() && entry.name !== ".gitkeep");

  // Only PDFs belong here. Ignoring anything else would let a letter, a video
  // or a demo sit in the resume folder looking published, so say so instead.
  const strays = files
    .filter((entry) => !entry.name.toLowerCase().endsWith(".pdf"))
    .map((entry) => entry.name)
    .sort();
  assertResume(
    strays.length === 0,
    `${RESUME_DIRECTORY}/ holds the live resume and nothing else, but it also contains `
      + `${strays.join(", ")}. Move those to ${OTHER_DIRECTORY}/.`
  );

  const candidates = files.map((entry) => entry.name).sort();

  const order = git(repositoryRoot, ["rev-list", "HEAD"]).split("\n").filter(Boolean);
  const { chosen, superseded } = chooseResume(candidates, (name) => (
    historyRank(repositoryRoot, `${RESUME_DIRECTORY}/${name}`, order)
  ));

  const pdf = await readFile(join(resumeDirectory, chosen));
  // A .pdf extension is a claim, not a fact -- check the file really is one
  // before it becomes the resume the site hands to a recruiter.
  assertResume(
    pdf.subarray(0, 5).toString("latin1") === "%PDF-",
    `${RESUME_DIRECTORY}/${chosen} is named like a PDF but is not one. Re-export it and upload again.`
  );
  const stamp = createHash("sha256").update(pdf).digest("hex").slice(0, STAMP_LENGTH);
  const indexPath = join(repositoryRoot, "index.html");
  const html = await readFile(indexPath, "utf8");
  const stamped = stampResumeLink(html, stamp);

  const changes = [];
  if (superseded.length > 0) changes.push(`archive ${superseded.join(", ")}`);
  if (chosen !== CANONICAL_FILE) changes.push(`rename ${chosen} to ${CANONICAL_FILE}`);
  if (stamped !== html) changes.push(`stamp the resume link with ?v=${stamp}`);
  if (changes.length === 0) return { changed: false, chosen, stamp, superseded, changes };

  if (check) {
    throw new Error(
      `The resume link is out of sync. Run \`npm run resume:sync\` to ${changes.join(", ")}.`
    );
  }

  // Superseded PDFs move out of the way first so the newest one can take their
  // place at the canonical filename. Nothing is deleted.
  if (superseded.length > 0) {
    const archiveDirectory = join(repositoryRoot, ARCHIVE_DIRECTORY);
    await mkdir(archiveDirectory, { recursive: true });
    for (const name of superseded) {
      const source = join(resumeDirectory, name);
      // Several resumes can be archived under the same name over time, so keep
      // them apart by their own content hash rather than overwriting.
      const digest = createHash("sha256").update(await readFile(source)).digest("hex");
      const archivedName = name.replace(/\.pdf$/i, `.${digest.slice(0, STAMP_LENGTH)}.pdf`);
      await rename(source, join(archiveDirectory, archivedName));
    }
  }
  if (chosen !== CANONICAL_FILE) {
    await rename(join(resumeDirectory, chosen), join(resumeDirectory, CANONICAL_FILE));
  }
  if (stamped !== html) await writeFile(indexPath, stamped, "utf8");

  return { changed: true, chosen, stamp, superseded, changes };
}

const isMain = process.argv[1]
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  const check = process.argv.includes("--check");
  syncResume({ check })
    .then(({ changed, chosen, stamp, superseded }) => {
      if (superseded.length > 0) {
        console.log(`Archived superseded resumes to ${ARCHIVE_DIRECTORY}/: ${superseded.join(", ")}`);
      }
      console.log(changed
        ? `Published ${chosen} as ${CANONICAL_PATH}?v=${stamp}`
        : `Resume is already in sync (${CANONICAL_PATH}?v=${stamp}).`);
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
