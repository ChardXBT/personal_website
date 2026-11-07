# Implicit State Machines — `personal_website`

Audit of `C:/Users/ericy/Downloads/personal_website` (origin/main @ c905578).

Note: `assets/js/intro.js` already declares a proper top-level machine
(`STATES`/`EVENTS`/`transition()`, intro.js:18-107). It is **not** a finding.
The findings below are the *secondary* machines that live outside it: lifecycle
state smeared across `data-*` strings, `hidden`/`class` flags, timers, and
paired variables, in some cases shadowing the declared machine.

---

## Project-reel phase (`data-project-phase`)

**States**: `idle` → `reel` → `list` (3 states, linear with a reset to `idle`).

**Encoded as**: `stage.dataset.projectPhase` raw strings, compared with
`===`/`!==` in ~15 places across JS and consumed by ~25 attribute selectors in
CSS. There is no enum or constant for the phase names anywhere; the initial
value is a string literal in HTML.

**Invalid combos**:
- Phase `"reel"` while `state !== PLAYING_INTRO` — reel-word animation timers
  survive a skip only because every callback re-checks the string
  (intro.js:910, 919, 962, 968, 976, 1076, 1079, 1095); one missed guard runs
  a reel transition on the resolved list.
- Phase `"list"` × stage classes `is-resolving-list` / `is-settling-heading` /
  `is-settling-list` — three booleans layered over the string phase; the
  combinations are representable but only `phase=list` + at most one settling
  class is meaningful (main.css:2550-2583, 2948-2950).
- `intro-bootstrap.js` force-writes `projectPhase = "list"` in the no-JS
  fallback path while `data-state` may still say `"initial"`.

**Transitions**:
- Write `idle`: intro.js:987 (`resetProjectSequence`), index.html:93 (initial),
  intro-bootstrap.js:44-45 (fallback sets `list` directly).
- Write `reel`: intro.js:1085 (timeline task at `TIMING.REEL_START`).
- Write `list`: intro.js:948 (`revealAllProjects`).
- Reads: intro.js:505, 531, 565, 576, 910, 919, 925-930, 962, 968, 976, 1015,
  1076, 1079, 1095; main.css:492-624, 1397-1414, 1902-1949, 2550-2583,
  2879-2884, 2944-2950, 3374.

**Risk**: The phase names exist in three languages (JS strings, HTML
attribute, CSS selectors) with no single source — a typo anywhere silently
breaks the reel→list hand-off (list never reveals, or reveals under the reel).
A late timeline task missing its `=== "list"` guard mutates the reel after the
list resolved, leaving half-shown rows (`is-revealed` on some `.project-word`
but not others). **Medium.**

---

## Project-detail lifecycle (`hidden` × `is-visible` × `detailClosing`)

**States**: closed → opening → open → closing (4 states; `closed` is the
absence of all markers).

**Encoded as**: spread across `detail.hidden` (boolean), the `.is-visible`
class, the `detailClosing` flag, the pending-timer variables
`detailFocusTimer`/`detailCloseTimer` (nonzero = a transition is in flight),
and `activeProjectId`/`activeProjectTrigger` (null vs set). The declared
`STATES.PROJECT_DETAIL` only marks "detail involved"; the sub-lifecycle is in
these flags.

**Invalid combos**:
- `detail.hidden === true` with `.is-visible` still present — nothing enforces
  exclusivity; CSS animates `.project-detail.is-visible` (main.css:694, 1959,
  1979) on an element the AT treats as hidden.
- `detailClosing === true` while `state === STATES.PROJECT_DETAIL` — a real,
  reachable combo: during the 280 ms close timer the dialog still *is* the
  detail state, so Escape (intro.js:1669) and backdrop clicks are swallowed
  by the `detailClosing` early-return (intro.js:1369) while the URL still
  holds `#project=<id>` and `activeProjectId` is still set.
- `activeProjectId` set while `detail.hidden === true` — representable
  (fields are independent); `requestProjectClose` (intro.js:1395-1406)
  trusts `activeProjectId` to decide whether to call `history.back()`.

**Transitions**:
- closed → opening: intro.js:1354 (`detail.hidden = false`), 1359-1363
  (timer adds `.is-visible`).
- open → closing: intro.js:1372-1373 (`detailClosing = true`, remove
  `.is-visible`).
- closing → closed: intro.js:1376-1389 (timer sets `hidden = true`,
  `activeProjectId = null`, `detailClosing = false`).
- cancel: `cancelDetailClose` intro.js:1321-1325; `openProject` re-entry
  intro.js:1334-1335.

**Risk**: Focus is moved into a dialog whose visibility is mid-flight (the
focus timer at intro.js:1359 fires regardless of a subsequent close request
unless the timer was canceled — it is, but only because every entry point
remembers to call `cancelDetailClose`). A keyboard user pressing Escape in
the closing window gets no feedback while the page still routes as
`#project=<id>`. **Medium.**

---

## Boot/readiness flags (`no-js` / `has-js` / `intro-locked` / `intro-ready` + fallback timer)

**States**: `no-js` (no JS, or module failed) → `has-js`+`intro-locked`
(booting, fallback armed) → `has-js`+`intro-ready` (module running) → back to
`no-js` (fallback restore). Four markers encode three real phases.

**Encoded as**: four independent `<html>` classes toggled in three files plus
a `window.__portfolioIntroFallback` object carrying an armed/canceled
`setTimeout`. Combinations are checked ad hoc (`intro-ready` presence is the
"did we boot" test at intro-bootstrap.js:31).

**Invalid combos**:
- `no-js` + `has-js` simultaneously — both classes are just classList
  entries; CSS keys off each separately (main.css uses `.no-js`, `.has-js`,
  `html.intro-locked` at 87-95) so a double-set produces contradictory rules.
- `intro-ready` + fallback timer still armed — the 3000 ms `armFallback`
  timer (intro-bootstrap.js:57-63) can fire while `intro.js` is mid-boot
  (module executing, `intro-ready` not yet added at intro.js:1892): the
  early-return at intro-bootstrap.js:31 fails, `restoreFallback` strips
  `intro-locked`/`canvas-*` classes and un-`inert`s regions
  (`restoreProgressiveContent`, intro-bootstrap.js:5-28) while `intro.js`
  concurrently applies `setPortfolioInteraction(false)` — two writers on the
  same `inert`/`aria-hidden`/`tabindex` fields.

**Transitions**:
- index.html:2 ships `class="no-js"`; intro-bootstrap.js:65-66 immediately
  swaps to `has-js`+`intro-locked` and arms the 3 s fallback.
- Module load: intro.js:182-184 repeats the same swap; intro.js:1891-1893
  adds `intro-ready` and calls `__portfolioIntroFallback.cancel()`.
- Failure path: intro-bootstrap.js:30-55 (`restoreFallback`, `onScriptLoadError`).

**Risk**: A slow-but-successful module load inside the 3 s window leaves the
page half-restored: scroll locks removed by the fallback while the intro still
believes it owns `intro-locked`, and `inert`/`aria-hidden` flipped twice on
the same nodes. Silent a11y/focus breakage rather than a crash. **Low-medium.**

---

## Dual scene encoding (`data-scene` vs `data-canvas-scene`)

**States**: `hello` / `school` / `build` (3 states).

**Encoded as**: the same three strings tracked **twice** — once in
`stage.dataset.scene` driven by the intro timeline, once in
`stage.dataset.canvasScene` driven by scroll progress. No shared constant;
`hello`/`school`/`build` appear as literals in the `sceneElements` map keys
(intro.js:226-230), `setScene`, CSS selectors (~30 sites), and HTML.

**Invalid combos**: `data-scene !== data-canvas-scene` is the normal case —
`setScene("build")` is called once by `finishIntro` (intro.js:1014) while
`canvasScene` keeps tracking scroll position, so the two can disagree
(`data-scene="build"` with `data-canvas-scene="hello"` mid-scroll).
`setScene` also drives `aria-hidden` (intro.js:427-430) from the *timeline*
value only: a scene can be visually centered by the canvas transform while
`aria-hidden="true"`. `data-canvas-scene` is **write-only** — set at
intro.js:658, deleted at 702, never read by JS or CSS.

**Transitions**:
- `data-scene` writes: setScene calls at intro.js:1014, 1070, 1074, 1083,
  1109; intro-bootstrap.js:44; index.html:92 (initial `hello`).
- `data-canvas-scene` writes: intro.js:656-660 (`updateCanvasCamera` derives
  scene from `canvasProgress` thresholds 0.25/0.75), deleted at
  intro.js:694-702 (`deactivateCanvas`).

**Risk**: Two sources of truth for "which scene are we in" diverge exactly
when scrolling is the driver; screen readers follow `data-scene`/aria-hidden
while sighted users see `canvasScene`. If a future change starts consuming
`data-canvas-scene` (it looks live but is dead), it will disagree with
`data-scene`. **Low.**

---

## Reel-word animation state (`is-current`/`is-incoming`/`is-outgoing` + paired vars)

**States**: per `.project-reel-word`: idle → incoming → current → outgoing →
idle (4 states; `idle` = no class).

**Encoded as**: three mutually-exclusive classes per word, mirrored into the
JS vars `currentReelWord`, `pendingReelWord`, `pendingReelIndex`
(intro.js:270-272). "Which word is live" is stored both in the DOM and in
parallel scalar variables that must be kept in sync by hand.

**Invalid combos**:
- `pendingReelWord` set while `currentReelWord === null` — the invariant
  "pending implies current" is only maintained by ordering
  (intro.js:594-598, 608-614); `showReelWord` at intro.js:587-591 reads
  `pendingReelWord` before checking `currentReelWord`.
- `pendingReelIndex === -1` while `pendingReelWord` non-null — two fields,
  one meaning; if they diverge, `startIncomingReelWord(pendingReelWord, -1)`
  calls `setActiveReelWord(-1)` which clamps to index 0 (intro.js:489) and
  highlights the wrong word.
- A word carrying `is-outgoing` whose `animationend` never fires (animation
  canceled by `resetIntroPlaybackPause`/`finishIntro`'s `cancelAnimations`)
  leaves `currentReelWord` pointing at a "dead" word until
  `clearReelWordStates` (intro.js:494-501) happens to run.

**Transitions**:
- idle → incoming: `startIncomingReelWord` intro.js:575-581.
- incoming → current: `onReelAnimationEnd` intro.js:600-604.
- current → outgoing: `showReelWord` intro.js:594-598.
- outgoing → idle (+ pending promotion): intro.js:605-615.
- reset: `clearReelWordStates` intro.js:494-501.

**Risk**: The DOM classes and the JS mirror can disagree after a canceled
animation; the next `showReelWord` then acts on a stale `currentReelWord`
(skips the transition or double-marks words). Visual glitch — a wrong word
highlighted or two words with `is-current` — rather than a crash. **Low.**

---

## Scope notes

- `git ls-files` tracked source audited: `assets/js/intro.js`,
  `assets/js/intro-bootstrap.js`, `content/site-content.js`, `index.html`,
  `404.html`, `assets/css/main.css` (state selectors), `scripts/*.mjs`.
- `scripts/*.mjs` (serve, sync, checks) and `content/site-content.js` are
  clean: `VALID_STAT_KINDS` (sync-project-content.mjs:22-27) is a real
  validated enum; `project.layout`/`project.type` are per-render config, not
  lifecycle state.
- `data-state` is a faithful DOM mirror of the declared `STATES` machine
  (written only via `updateState`, intro.js:875-892) — declared, not implicit.
- Write-only mirrors found but not findings per se: `data-reel-index`
  (written intro.js:490, read nowhere), `data-canvas-scene` (finding above).
