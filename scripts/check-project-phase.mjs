import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const [introSource, bootstrapSource, html, css] = await Promise.all([
  readFile(join(repositoryRoot, "assets", "js", "intro.js"), "utf8"),
  readFile(join(repositoryRoot, "assets", "js", "intro-bootstrap.js"), "utf8"),
  readFile(join(repositoryRoot, "index.html"), "utf8"),
  readFile(join(repositoryRoot, "assets", "css", "main.css"), "utf8")
]);

function assertPhase(condition, message) {
  if (!condition) throw new Error(`Invalid project phase machine: ${message}`);
}

// Regression guard: the REEL_START timeline task fired unguarded, so a late
// task could rewrite a resolved list back to "reel". Its callback must bail
// out once data-project-phase has reached "list".
const reelWrite = introSource.match(
  /(?:dataset\.projectPhase\s*=\s*"reel"|transitionProjectPhase\(stage,\s*PROJECT_PHASES\.REEL\))/
);
assertPhase(reelWrite, "no write of the reel phase was found in intro.js.");
const taskStart = introSource.lastIndexOf("scheduleTimeline(", reelWrite.index);
assertPhase(taskStart >= 0, "the reel phase write must live inside the intro timeline.");
const reelTaskPreamble = introSource.slice(taskStart, reelWrite.index);
assertPhase(
  /PROJECT_PHASES\.LIST|===\s*"list"/.test(reelTaskPreamble) && /\breturn\b/.test(reelTaskPreamble),
  "the reel-start timeline task must bail out once data-project-phase resolved to list."
);

// intro.js is a module: every phase read and write must go through the
// declared machine so unknown values fail loudly.
assertPhase(
  !introSource.includes("dataset.projectPhase"),
  "intro.js must read and write data-project-phase only through project-phase.js helpers."
);

const {
  getProjectPhase,
  isProjectPhase,
  PROJECT_PHASES,
  transitionProjectPhase
} = await import(pathToFileURL(join(repositoryRoot, "assets", "js", "project-phase.js")).href);

assertPhase(Object.isFrozen(PROJECT_PHASES), "PROJECT_PHASES must be frozen.");
assertPhase(
  ["idle", "reel", "list"].every((value) => Object.values(PROJECT_PHASES).includes(value))
    && Object.keys(PROJECT_PHASES).length === 3,
  "PROJECT_PHASES must declare exactly idle/reel/list."
);

// Non-module surfaces keep literal phase strings; pin them to the enum.
const declared = new Set(Object.values(PROJECT_PHASES));
for (const [label, source, pattern] of [
  ["index.html", html, /data-project-phase="([^"]*)"/g],
  ["main.css", css, /data-project-phase="([^"]*)"/g],
  ["intro-bootstrap.js", bootstrapSource, /dataset\.projectPhase\s*=\s*"([^"]*)"/g]
]) {
  const values = [...source.matchAll(pattern)].map((match) => match[1]);
  assertPhase(values.length > 0, `${label} must reference data-project-phase.`);
  for (const value of values) {
    assertPhase(declared.has(value), `${label} uses undeclared phase "${value}".`);
  }
}

const stageWith = (phase) => ({ dataset: { projectPhase: phase } });
const throws = (run) => {
  try {
    run();
  } catch {
    return true;
  }
  return false;
};

// The declared graph: idle -> reel -> list, with reset to idle from anywhere.
for (const [from, to] of [
  ["idle", "reel"],
  ["idle", "list"],
  ["reel", "list"],
  ["reel", "idle"],
  ["list", "idle"]
]) {
  const stage = stageWith(from);
  transitionProjectPhase(stage, to);
  assertPhase(stage.dataset.projectPhase === to, `${from} -> ${to} must apply to the stage.`);
}
for (const phase of ["idle", "reel", "list"]) {
  const stage = stageWith(phase);
  transitionProjectPhase(stage, phase);
  assertPhase(stage.dataset.projectPhase === phase, `${phase} -> ${phase} must stay idempotent.`);
}
assertPhase(
  throws(() => transitionProjectPhase(stageWith("list"), "reel")),
  "list -> reel must throw: a resolved list must never re-enter the reel."
);
assertPhase(
  throws(() => transitionProjectPhase(stageWith("bogus"), "idle")),
  "an unknown stored phase must fail loudly instead of transitioning."
);
assertPhase(
  throws(() => transitionProjectPhase(stageWith("idle"), "bogus")),
  "an unknown target phase must be rejected."
);
assertPhase(
  throws(() => getProjectPhase(stageWith(undefined))),
  "a missing data-project-phase attribute must fail loudly."
);
assertPhase(
  getProjectPhase(stageWith("reel")) === "reel",
  "getProjectPhase must return the stored phase."
);
assertPhase(
  !isProjectPhase("paused") && !isProjectPhase(undefined),
  "isProjectPhase must reject undeclared values."
);

console.log("Project phase machine is valid (declared transitions, reel guard, pinned literals).");
