import {
  BUILD_CATEGORIES,
  DATA_COLLECTION_EVIDENCE,
  DATA_COLLECTION_PROJECTS,
  PROJECTS,
  REEL_ITEMS
} from "../../content/site-content.js?v=20260730-1";

export {
  BUILD_CATEGORIES,
  DATA_COLLECTION_EVIDENCE,
  DATA_COLLECTION_PROJECTS,
  PROJECTS,
  REEL_ITEMS
} from "../../content/site-content.js?v=20260730-1";

export const INTRO_SESSION_KEY = "ericIntroPlayed";
export const INTRO_TAB_MARKER = "ericIntroTabPlayed";

export const STATES = Object.freeze({
  INITIAL: "initial",
  PLAYING_INTRO: "playingIntro",
  SKIPPED_TO_PROJECTS: "skippedToProjects",
  PROJECT_STAGE: "projectStage",
  PROJECT_DETAIL: "projectDetail",
  STATIC_PAGE: "staticPage",
  REDUCED_MOTION: "reducedMotion"
});

export const EVENTS = Object.freeze({
  START: "START",
  COMPLETE_INTRO: "COMPLETE_INTRO",
  SKIP_INTRO: "SKIP_INTRO",
  SETTLE_AFTER_SKIP: "SETTLE_AFTER_SKIP",
  OPEN_PROJECT: "OPEN_PROJECT",
  CLOSE_PROJECT: "CLOSE_PROJECT",
  ENTER_STATIC: "ENTER_STATIC",
  RETURN_TO_STAGE: "RETURN_TO_STAGE"
});

const REEL_START = 4200;
const REEL_ENTRY = 260;
const REEL_EXIT = 140;
const REEL_ITEM = 800;
const REEL_FINAL_HOLD = 460;
const LIST_RESOLVE = REEL_START
  + (Math.max(0, REEL_ITEMS.length - 1) * REEL_ITEM)
  + REEL_EXIT
  + REEL_ENTRY
  + REEL_FINAL_HOLD;
const LIST_HEADING_SETTLE = 680;
const LIST_ROW_STAGGER = 320;
const LIST_ROW_SETTLE = 460;
const WHEEL_INTENT_THRESHOLD = 48;
const WHEEL_INTENT_WINDOW = 240;
const TOUCH_INTENT_THRESHOLD = 44;

export const TIMING = Object.freeze({
  SCHOOL: 1400,
  SCENE_TRANSITION: 760,
  BUILD: 3200,
  REEL_START,
  REEL_ENTRY,
  REEL_EXIT,
  REEL_ITEM,
  LIST_RESOLVE,
  LIST_HEADING_SETTLE,
  LIST_ROW_STAGGER,
  LIST_ROW_SETTLE
});

export function getInitialState({ reducedMotion = false, hasPlayed = false } = {}) {
  if (reducedMotion) return STATES.REDUCED_MOTION;
  if (hasPlayed) return STATES.PROJECT_STAGE;
  return STATES.PLAYING_INTRO;
}

export function transition(state, event, context = {}) {
  switch (state) {
    case STATES.INITIAL:
      if (event === EVENTS.START) return getInitialState(context);
      break;
    case STATES.PLAYING_INTRO:
      if (event === EVENTS.COMPLETE_INTRO) return STATES.PROJECT_STAGE;
      if (event === EVENTS.SKIP_INTRO) return STATES.SKIPPED_TO_PROJECTS;
      break;
    case STATES.SKIPPED_TO_PROJECTS:
      if (event === EVENTS.SETTLE_AFTER_SKIP) return STATES.PROJECT_STAGE;
      break;
    case STATES.PROJECT_STAGE:
    case STATES.REDUCED_MOTION:
      if (event === EVENTS.OPEN_PROJECT) return STATES.PROJECT_DETAIL;
      if (event === EVENTS.ENTER_STATIC) return STATES.STATIC_PAGE;
      break;
    case STATES.PROJECT_DETAIL:
      if (event === EVENTS.CLOSE_PROJECT) {
        return context.returnState === STATES.REDUCED_MOTION
          ? STATES.REDUCED_MOTION
          : STATES.PROJECT_STAGE;
      }
      break;
    case STATES.STATIC_PAGE:
      if (event === EVENTS.RETURN_TO_STAGE) return STATES.PROJECT_STAGE;
      break;
    default:
      break;
  }
  return state;
}

export function safeHasPlayed(storage) {
  try {
    return storage?.getItem(INTRO_SESSION_KEY) === "true";
  } catch (_error) {
    return false;
  }
}

export function safeSetPlayed(storage) {
  try {
    storage?.setItem(INTRO_SESSION_KEY, "true");
    return true;
  } catch (_error) {
    return false;
  }
}

export function safeSessionStorage(target) {
  try {
    return target?.sessionStorage ?? null;
  } catch (_error) {
    return null;
  }
}

export function hasPlayedInThisTab(storage, tabName = "") {
  return safeHasPlayed(storage) && String(tabName).split(/\s+/).includes(INTRO_TAB_MARKER);
}

export function markPlayedInThisTab(storage, tabTarget) {
  const stored = safeSetPlayed(storage);
  try {
    const names = String(tabTarget?.name || "").split(/\s+/).filter(Boolean);
    if (!names.includes(INTRO_TAB_MARKER)) names.push(INTRO_TAB_MARKER);
    if (tabTarget) tabTarget.name = names.join(" ");
  } catch (_error) {
    // The session flag still preserves same-tab reload behavior in restricted browsers.
  }
  return stored;
}

export function clearPlayedInThisTab(storage, tabTarget) {
  try {
    storage?.removeItem(INTRO_SESSION_KEY);
  } catch (_error) {
    // The window-name marker is still removed when storage is unavailable.
  }
  try {
    const names = String(tabTarget?.name || "")
      .split(/\s+/)
      .filter((name) => name && name !== INTRO_TAB_MARKER);
    if (tabTarget) tabTarget.name = names.join(" ");
  } catch (_error) {
    // Restricted window-name access should not block an explicit replay request.
  }
}

export function isMeaningfulWheel(deltaY, accumulatedDelta = 0) {
  const nextDelta = Math.max(0, Number(deltaY) || 0);
  return nextDelta >= WHEEL_INTENT_THRESHOLD
    || Math.max(0, Number(accumulatedDelta) || 0) + nextDelta >= WHEEL_INTENT_THRESHOLD;
}

function createIntroExperience(doc = document, win = window) {
  const root = doc.documentElement;
  root.classList.remove("no-js");
  root.classList.add("has-js", "intro-locked");
  win.__portfolioIntroFallback?.arm?.();

  const stage = doc.querySelector("#intro-stage");
  const projectRows = Array.from(doc.querySelectorAll(".project-word"));
  const projectTriggers = Array.from(doc.querySelectorAll(".project-word[data-project]"));
  const detail = doc.querySelector("#project-detail");
  const detailTitle = doc.querySelector("#detail-title");
  const detailDescription = doc.querySelector("#detail-description");
  const detailMetric = doc.querySelector("#detail-metric");
  const detailMetricNote = doc.querySelector("#detail-metric-note");
  const detailProvenance = doc.querySelector("#detail-provenance");
  const detailPosition = doc.querySelector("#detail-position");
  const detailPitch = doc.querySelector("#detail-pitch");
  const detailHighlights = doc.querySelector("#detail-highlights");
  const detailStack = doc.querySelector("#detail-stack");
  const detailLinks = doc.querySelector("#detail-links");
  const detailLayout = doc.querySelector("#detail-layout");
  const detailAside = doc.querySelector("#detail-aside");
  const detailCollection = doc.querySelector("#detail-collection");
  const detailCollectionEvidence = doc.querySelector("#detail-collection-evidence");
  const detailCollectorList = doc.querySelector("#detail-collector-list");
  const projectsById = new Map(PROJECTS.map((project) => [project.id, project]));
  const closeButton = doc.querySelector("[data-detail-close]");
  const skipButton = doc.querySelector("[data-intro-skip]");
  const introUtilities = doc.querySelector("[data-intro-utilities]");
  const skipNavigation = doc.querySelector(".skip-navigation");
  const replayLink = doc.querySelector("[data-replay-intro]");
  const projectPanel = doc.querySelector("#project-panel");
  const projectList = doc.querySelector(".project-list");
  const buildSentence = doc.querySelector(".build-sentence");
  const buildHeading = doc.querySelector(".beat-build-heading");
  const projectReel = doc.querySelector(".project-reel");
  const reelWords = Array.from(doc.querySelectorAll(".project-reel-word"));
  const reelGlyphs = Array.from(doc.querySelectorAll(".project-reel-glyph"));
  const textWorld = doc.querySelector(".text-world");
  const cameraWindow = doc.querySelector(".camera-window");
  const status = doc.querySelector("#intro-status");
  const staticSite = doc.querySelector("#static-site");
  const modalBackgroundRegions = [skipNavigation, projectPanel, staticSite].filter(Boolean);
  const staticInteractive = Array.from(staticSite.querySelectorAll("a, button"));
  const sceneElements = new Map([
    ["hello", doc.querySelector(".scene-hello")],
    ["school", doc.querySelector(".scene-school")],
    ["build", doc.querySelector(".scene-build")]
  ]);
  const reducedMotionQuery = win.matchMedia("(prefers-reduced-motion: reduce)");
  const stackedBuildQuery = win.matchMedia("(max-width: 56rem)");
  const sessionStorage = safeSessionStorage(win);
  const timers = new Set();
  const timelineTimers = new Set();
  let layoutFrame = 0;
  let layoutGeneration = 0;
  let layoutScrollSettling = false;
  let layoutViewportWidth = doc.documentElement.clientWidth;
  let layoutViewportHeight = win.innerHeight;
  let scrollRevision = 0;
  let introGestureGuardsActive = false;
  let state = STATES.INITIAL;
  let returnState = STATES.PROJECT_STAGE;
  let activeProjectTrigger = null;
  let activeProjectId = null;
  let detailCloseTimer = 0;
  let detailFocusTimer = 0;
  let skipHideTimer = 0;
  let routeFrame = 0;
  let routeScrollSettling = false;
  let motionReduced = reducedMotionQuery.matches;
  let wheelIntentTotal = 0;
  let wheelIntentAt = 0;
  let wheelIntentDirection = 0;
  let touchStartX = null;
  let touchStartY = null;
  let detailClosing = false;
  let canvasActive = false;
  let canvasFrame = 0;
  let canvasTransform = "";
  let canvasScene = "";
  let canvasProgress = 1;
  let canvasViewportHeight = 0;
  let canvasStageTop = 0;
  let canvasRange = 0;
  let activeReelIndex = 0;
  let currentReelWord = null;
  let pendingReelWord = null;
  let pendingReelIndex = -1;
  let sentenceShifts = [];
  let introVisibilityPaused = false;
  let pausedIntroAnimations = [];
  let resumeFrame = 0;
  let canvasActivationFrame = 0;
  let canvasActivationGeneration = 0;
  stage.style.setProperty("--scene-transition-duration", `${TIMING.SCENE_TRANSITION}ms`);
  stage.style.setProperty("--reel-entry-duration", `${TIMING.REEL_ENTRY}ms`);
  stage.style.setProperty("--reel-exit-duration", `${TIMING.REEL_EXIT}ms`);

  try {
    if ("scrollRestoration" in win.history) {
      win.history.scrollRestoration = "manual";
    }
  } catch (_error) {
    // Browsers with restricted history access still get the explicit scroll reset below.
  }

  function schedule(callback, delay) {
    const timer = win.setTimeout(() => {
      timers.delete(timer);
      callback();
    }, delay);
    timers.add(timer);
    return timer;
  }

  function cancelScheduled(timer) {
    if (!timer) return;
    win.clearTimeout(timer);
    timers.delete(timer);
  }

  function timelineNow() {
    return win.performance?.now?.() ?? Date.now();
  }

  function armTimelineTask(task) {
    if (introVisibilityPaused || task.timer || !timelineTimers.has(task)) return;
    task.startedAt = timelineNow();
    task.timer = win.setTimeout(() => {
      task.timer = 0;
      timelineTimers.delete(task);
      task.callback();
    }, Math.max(0, task.remaining));
  }

  function scheduleTimeline(callback, delay) {
    const task = {
      callback,
      remaining: Math.max(0, Number(delay) || 0),
      startedAt: 0,
      timer: 0
    };
    timelineTimers.add(task);
    armTimelineTask(task);
    return task;
  }

  function pauseIntroTimeline() {
    const pausedAt = timelineNow();
    timelineTimers.forEach((task) => {
      if (!task.timer) return;
      win.clearTimeout(task.timer);
      task.timer = 0;
      task.remaining = Math.max(0, task.remaining - (pausedAt - task.startedAt));
    });
  }

  function resumeIntroTimeline() {
    timelineTimers.forEach(armTimelineTask);
  }

  function clearTimeline() {
    timelineTimers.forEach((task) => {
      if (task.timer) win.clearTimeout(task.timer);
    });
    timelineTimers.clear();
  }

  function cancelResumeFrame() {
    if (resumeFrame) win.cancelAnimationFrame(resumeFrame);
    resumeFrame = 0;
  }

  function resetIntroPlaybackPause({ cancelAnimations = false } = {}) {
    cancelResumeFrame();
    introVisibilityPaused = false;
    const animations = pausedIntroAnimations;
    pausedIntroAnimations = [];
    if (!cancelAnimations) return;
    animations.forEach((animation) => {
      try {
        animation.cancel();
      } catch (_error) {
        // A detached animation has no remaining lifecycle to clean up.
      }
    });
  }

  function pauseIntroPlayback() {
    if (state !== STATES.PLAYING_INTRO) return;
    cancelResumeFrame();
    if (introVisibilityPaused) return;
    introVisibilityPaused = true;
    pauseIntroTimeline();
    try {
      pausedIntroAnimations = typeof stage.getAnimations === "function"
        ? stage.getAnimations({ subtree: true }).filter((animation) => animation.playState === "running")
        : [];
      pausedIntroAnimations.forEach((animation) => animation.pause());
    } catch (_error) {
      pausedIntroAnimations = [];
    }
  }

  function resumeIntroPlayback() {
    if (doc.hidden || !introVisibilityPaused || resumeFrame) return;
    resumeFrame = win.requestAnimationFrame(() => {
      resumeFrame = 0;
      if (doc.hidden || !introVisibilityPaused || state !== STATES.PLAYING_INTRO) return;
      introVisibilityPaused = false;
      const animations = pausedIntroAnimations;
      pausedIntroAnimations = [];
      animations.forEach((animation) => {
        try {
          if (animation.playState === "paused") animation.play();
        } catch (_error) {
          // A completed or detached animation no longer needs resuming.
        }
      });
      if (state === STATES.PLAYING_INTRO) resumeIntroTimeline();
    });
  }

  function onVisibilityChange() {
    if (doc.hidden) pauseIntroPlayback();
    else resumeIntroPlayback();
  }

  function onPageShow(event) {
    resumeIntroPlayback();
    if (!event.persisted) return;
    scheduleViewportLayout({ type: "pageshow", force: true });
    scheduleRouteReconcile();
    if (canvasActive) scheduleCanvasCamera();
  }

  function clamp(minimum, value, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
  }

  function setScene(scene) {
    stage.dataset.scene = scene;
    sceneElements.forEach((element, name) => {
      if (!element) return;
      element.setAttribute("aria-hidden", String(name !== scene));
    });
  }

  function parseRoute(hash = win.location.hash) {
    if (!hash) return { kind: "base" };
    if (hash === "#static-site") return { kind: "static" };
    if (hash === "#data-collection" || hash === "#monitoring-discovery") {
      return { kind: "legacyDataCollection" };
    }
    if (!hash.startsWith("#project=")) return { kind: "other", hash };

    let projectId = "";
    try {
      projectId = decodeURIComponent(hash.slice("#project=".length));
    } catch (_error) {
      return { kind: "invalid", projectId: "" };
    }
    const project = PROJECTS.find((candidate) => candidate.id === projectId);
    return project ? { kind: "project", project, projectId } : { kind: "invalid", projectId };
  }

  function routeState(kind, projectId = null) {
    const current = win.history.state && typeof win.history.state === "object"
      ? win.history.state
      : {};
    return {
      ...current,
      portfolioRoute: projectId ? { kind, projectId } : { kind }
    };
  }

  function baseUrl() {
    return `${win.location.pathname}${win.location.search}`;
  }

  function projectHash(projectId) {
    return `#project=${encodeURIComponent(projectId)}`;
  }

  function replaceRoute(kind = "base", projectId = null) {
    const url = kind === "project" && projectId
      ? projectHash(projectId)
      : kind === "static"
        ? "#static-site"
        : baseUrl();
    win.history.replaceState(routeState(kind, projectId), "", url);
  }

  function seedDirectProjectRoute(projectId) {
    const managedRoute = win.history.state?.portfolioRoute;
    if (managedRoute?.kind === "project" && managedRoute.projectId === projectId) return;
    win.history.replaceState(routeState("base"), "", baseUrl());
    win.history.pushState(routeState("project", projectId), "", projectHash(projectId));
  }

  function setActiveReelWord(index) {
    if (!projectReel || reelWords.length === 0) return;
    activeReelIndex = clamp(0, index, reelWords.length - 1);
    stage.dataset.reelIndex = String(activeReelIndex);
    recenterActiveSentence();
  }

  function clearReelWordStates() {
    currentReelWord = null;
    pendingReelWord = null;
    pendingReelIndex = -1;
    reelWords.forEach((word) => {
      word.classList.remove("is-current", "is-incoming", "is-outgoing");
    });
  }

  function measureProjectReel() {
    if (!buildSentence || !projectReel || reelGlyphs.length !== reelWords.length) return;
    if (stage.dataset.projectPhase === "list") {
      buildSentence.style.removeProperty("--sentence-shift");
      buildSentence.style.removeProperty("--sentence-shift-y");
      return;
    }
    if (stackedBuildQuery.matches) {
      buildSentence.style.removeProperty("--reel-measured-width");
      sentenceShifts = reelGlyphs.map(() => 0);
      recenterActiveSentence();
      return;
    }

    const measuredWidth = reelGlyphs.reduce((longest, glyph) => {
      const fontSize = Number.parseFloat(win.getComputedStyle(glyph).fontSize) || 0;
      return Math.max(longest, glyph.scrollWidth + Math.max(12, fontSize * 0.16));
    }, 0);
    if (measuredWidth > 0) {
      buildSentence.style.setProperty("--reel-measured-width", `${Math.ceil(measuredWidth)}px`);
    }
    cacheSentenceShifts();
    recenterActiveSentence();
  }

  function cacheSentenceShifts() {
    sentenceShifts = [];
    if (!buildSentence || !buildHeading || !projectReel || reelGlyphs.length !== reelWords.length) return;
    if (stage.dataset.projectPhase === "list") return;
    if (stackedBuildQuery.matches) {
      sentenceShifts = reelGlyphs.map(() => 0);
      return;
    }

    const viewportWidth = Math.max(1, doc.documentElement.clientWidth || win.innerWidth);
    const sentenceRect = buildSentence.getBoundingClientRect();
    const headingRect = buildHeading.getBoundingClientRect();
    const reelRect = projectReel.getBoundingClientRect();
    const sentenceLeft = (viewportWidth - sentenceRect.width) / 2;
    const headingLeft = sentenceLeft + (headingRect.left - sentenceRect.left);
    const headingRight = headingLeft + headingRect.width;
    const reelLeft = sentenceLeft + (reelRect.left - sentenceRect.left);
    const edge = clamp(8, viewportWidth * 0.02, 28);

    sentenceShifts = reelGlyphs.map((glyph) => {
      const glyphRect = glyph.getBoundingClientRect();
      const glyphLeft = reelLeft + (glyphRect.left - reelRect.left);
      const glyphRight = glyphLeft + glyphRect.width;
      const visibleLeft = Math.min(headingLeft, glyphLeft);
      const visibleRight = Math.max(headingRight, glyphRight);
      const desiredShift = (viewportWidth / 2) - ((visibleLeft + visibleRight) / 2);
      const minimumShift = edge - visibleLeft;
      const maximumShift = (viewportWidth - edge) - visibleRight;
      return minimumShift <= maximumShift
        ? clamp(minimumShift, desiredShift, maximumShift)
        : desiredShift;
    });
  }

  function recenterActiveSentence() {
    if (!buildSentence) return;
    const projectPhase = stage.dataset.projectPhase;
    if (projectPhase !== "idle" && projectPhase !== "reel") return;
    if (stackedBuildQuery.matches) {
      buildSentence.style.setProperty("--sentence-shift", "0px");
      return;
    }
    const nextShift = sentenceShifts[activeReelIndex];
    if (!Number.isFinite(nextShift)) return;
    buildSentence.style.setProperty("--sentence-shift", `${Math.round(nextShift * 100) / 100}px`);
  }

  function startIncomingReelWord(word, index) {
    if (stage.dataset.projectPhase !== "reel") return;
    setActiveReelWord(index);
    word.classList.remove("is-current", "is-outgoing");
    word.classList.add("is-incoming");
    currentReelWord = word;
  }

  function showReelWord(index) {
    if (!projectReel || reelWords.length === 0) return;
    const nextIndex = clamp(0, index, reelWords.length - 1);
    const nextWord = reelWords[nextIndex];
    if (currentReelWord === nextWord || pendingReelWord === nextWord) return;

    if (!currentReelWord) {
      startIncomingReelWord(nextWord, nextIndex);
      return;
    }

    pendingReelWord = nextWord;
    pendingReelIndex = nextIndex;
    currentReelWord.classList.remove("is-current", "is-incoming");
    currentReelWord.classList.add("is-outgoing");
  }

  function onReelAnimationEnd(event) {
    const word = event.currentTarget;
    if (event.animationName === "project-reel-enter" && word === currentReelWord) {
      word.classList.remove("is-incoming");
      word.classList.add("is-current");
    } else if (event.animationName === "project-reel-exit" && word === currentReelWord) {
      word.classList.remove("is-outgoing");
      currentReelWord = null;
      if (pendingReelWord) {
        const nextWord = pendingReelWord;
        const nextIndex = pendingReelIndex;
        pendingReelWord = null;
        pendingReelIndex = -1;
        startIncomingReelWord(nextWord, nextIndex);
      }
    }
  }

  function refreshCanvasMetrics() {
    const stageRect = stage.getBoundingClientRect();
    const stageHeight = Math.max(stageRect.height, 1);
    const cameraHeight = cameraWindow?.getBoundingClientRect().height;
    canvasViewportHeight = Math.max(cameraHeight || win.innerHeight, 1);
    canvasStageTop = stageRect.top + win.scrollY;
    canvasRange = Math.max(stageHeight - canvasViewportHeight, 1);
  }

  function canvasProjectTop() {
    if (canvasRange <= 0) refreshCanvasMetrics();
    return canvasStageTop + canvasRange;
  }

  function updateCanvasCamera() {
    canvasFrame = 0;
    if (!canvasActive || !textWorld) return;

    if (canvasRange <= 0) refreshCanvasMetrics();
    const viewportHeight = canvasViewportHeight;
    const progress = clamp(0, (win.scrollY - canvasStageTop) / canvasRange, 1);
    canvasProgress = progress;
    let y = 0;

    if (progress <= 0.5) {
      y = -95 * (progress / 0.5);
    } else {
      const buildProgress = (progress - 0.5) / 0.5;
      y = -95 - (100 * buildProgress);
    }

    const roundedY = Math.round(y * 10000) / 10000;
    const nextTransform = `translateY(${Math.round((roundedY / 100) * viewportHeight * 100) / 100}px) scale(1)`;
    if (nextTransform !== canvasTransform) {
      textWorld.style.transform = nextTransform;
      canvasTransform = nextTransform;
    }

    const nextScene = progress < 0.25 ? "hello" : progress < 0.75 ? "school" : "build";
    if (nextScene !== canvasScene) {
      stage.dataset.canvasScene = nextScene;
      canvasScene = nextScene;
    }
  }

  function scheduleCanvasCamera() {
    if (!canvasActive || canvasFrame) return;
    canvasFrame = win.requestAnimationFrame(updateCanvasCamera);
  }

  function onCanvasScroll() {
    scrollRevision += 1;
    if (!canvasActive && (state === STATES.INITIAL || state === STATES.PLAYING_INTRO)) {
      if (state === STATES.PLAYING_INTRO && Math.abs(win.scrollY - stage.offsetTop) > 2) {
        skipIntro({ source: "scroll" });
      }
      return;
    }
    const isPastCanvas = canvasActive && canvasRange > 0 && win.scrollY >= canvasStageTop + canvasRange;
    if (isPastCanvas && canvasProgress >= 1) return;
    scheduleCanvasCamera();
  }

  function cancelCanvasActivation() {
    canvasActivationGeneration += 1;
    if (canvasActivationFrame) win.cancelAnimationFrame(canvasActivationFrame);
    canvasActivationFrame = 0;
  }

  function deactivateCanvas() {
    cancelCanvasActivation();
    canvasActive = false;
    if (canvasFrame) win.cancelAnimationFrame(canvasFrame);
    canvasFrame = 0;
    canvasTransform = "";
    canvasScene = "";
    canvasProgress = 1;
    canvasViewportHeight = 0;
    canvasStageTop = 0;
    canvasRange = 0;
    stage.classList.remove("canvas-ready");
    root.classList.remove("canvas-mode");
    root.classList.remove("canvas-settling");
    delete stage.dataset.canvasScene;
    textWorld?.style.removeProperty("transform");
  }

  function initializeCanvas() {
    canvasActive = true;
    canvasProgress = 1;
    stage.classList.add("canvas-ready");
    root.classList.add("canvas-mode");
    refreshCanvasMetrics();
    const viewportHeight = canvasViewportHeight;
    canvasTransform = `translateY(${Math.round(-1.95 * viewportHeight * 100) / 100}px) scale(1)`;
    textWorld.style.transform = canvasTransform;
  }

  function settleCanvasPosition(settleAtProjects) {
    if (settleAtProjects) {
      const projectTop = canvasProjectTop();
      if (Math.abs(win.scrollY - projectTop) > 1) {
        win.scrollTo({ top: projectTop, behavior: "auto" });
      }
    }
    updateCanvasCamera();
  }

  function activateCanvas({ settleAtProjects = true, onReady = null } = {}) {
    cancelCanvasActivation();
    const activationGeneration = canvasActivationGeneration;
    initializeCanvas();

    canvasActivationFrame = win.requestAnimationFrame(() => {
      canvasActivationFrame = 0;
      if (!canvasActive || activationGeneration !== canvasActivationGeneration) return;
      settleCanvasPosition(settleAtProjects);
      canvasActivationFrame = win.requestAnimationFrame(() => {
        canvasActivationFrame = 0;
        if (!canvasActive || activationGeneration !== canvasActivationGeneration) return;
        onReady?.();
      });
    });
  }

  function activateCanvasBeforePaint({ settleAtProjects = true, onReady = null } = {}) {
    cancelCanvasActivation();
    const activationGeneration = canvasActivationGeneration;
    canvasActivationFrame = win.requestAnimationFrame(() => {
      canvasActivationFrame = 0;
      if (activationGeneration !== canvasActivationGeneration) return;
      initializeCanvas();
      settleCanvasPosition(settleAtProjects);
      onReady?.();
    });
  }

  function scheduleViewportLayout(event) {
    const nextWidth = doc.documentElement.clientWidth;
    const nextHeight = win.innerHeight;
    const forceLayout = event?.force === true || event?.type === "load" || event?.type === "orientationchange";
    const widthChanged = Math.abs(nextWidth - layoutViewportWidth) > 1;
    const heightChanged = Math.abs(nextHeight - layoutViewportHeight) > 1;
    if (!forceLayout && !widthChanged && !heightChanged) return;
    if (widthChanged) layoutViewportWidth = nextWidth;
    if (heightChanged) layoutViewportHeight = nextHeight;
    const scheduledLayoutGeneration = ++layoutGeneration;
    if (layoutFrame) win.cancelAnimationFrame(layoutFrame);
    layoutFrame = 0;
    const scheduledScrollRevision = scrollRevision;
    const scheduledState = state;
    const preservedCanvasProgress = canvasProgress;
    const shouldRestoreStaticPosition = state === STATES.STATIC_PAGE;
    const preservedStaticOffset = shouldRestoreStaticPosition
      ? Math.max(0, -staticSite.getBoundingClientRect().top)
      : 0;
    const shouldRestoreCanvasPosition = canvasActive && state !== STATES.STATIC_PAGE;
    if (shouldRestoreStaticPosition || shouldRestoreCanvasPosition) {
      layoutScrollSettling = true;
    }

    const finishLayoutScrollSettlement = () => {
      if (!layoutScrollSettling) return;
      win.requestAnimationFrame(() => {
        if (scheduledLayoutGeneration === layoutGeneration) layoutScrollSettling = false;
      });
    };

    layoutFrame = win.requestAnimationFrame(() => {
      layoutFrame = 0;
      if (scheduledLayoutGeneration !== layoutGeneration) return;
      if (widthChanged || forceLayout) measureProjectReel();
      const stateIsCurrent = state === scheduledState;
      if (shouldRestoreStaticPosition && stateIsCurrent) {
        win.scrollTo({ top: staticSite.offsetTop + preservedStaticOffset, behavior: "auto" });
        updateState(transition(state, EVENTS.ENTER_STATIC));
      }
      if (!canvasActive) {
        finishLayoutScrollSettlement();
        return;
      }
      refreshCanvasMetrics();
      if (!shouldRestoreStaticPosition
        && shouldRestoreCanvasPosition
        && stateIsCurrent
        && scrollRevision === scheduledScrollRevision) {
        win.scrollTo({ top: canvasStageTop + (canvasRange * preservedCanvasProgress), behavior: "auto" });
      }
      updateCanvasCamera();
      finishLayoutScrollSettlement();
    });
  }

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  function setModalIsolation(isolated) {
    modalBackgroundRegions.forEach((region) => {
      region.inert = isolated;
      if (isolated) region.setAttribute("aria-hidden", "true");
      else region.removeAttribute("aria-hidden");
    });
  }

  function setPortfolioInteraction(enabled) {
    if (projectPanel) {
      projectPanel.inert = !enabled;
      if (enabled) projectPanel.removeAttribute("aria-hidden");
      else projectPanel.setAttribute("aria-hidden", "true");
    }
    staticSite.inert = !enabled;
    if (enabled) staticSite.removeAttribute("aria-hidden");
    else staticSite.setAttribute("aria-hidden", "true");
    staticInteractive.forEach((element) => {
      if (enabled) element.removeAttribute("tabindex");
      else element.setAttribute("tabindex", "-1");
    });
  }

  function updateSkipUtility(nextState) {
    if (!skipButton) return;
    const skipVisible = nextState === STATES.INITIAL
      || nextState === STATES.PLAYING_INTRO
      || nextState === STATES.SKIPPED_TO_PROJECTS;

    cancelScheduled(skipHideTimer);
    skipHideTimer = 0;
    skipButton.disabled = nextState !== STATES.PLAYING_INTRO;

    if (skipVisible) {
      skipButton.hidden = false;
      introUtilities?.classList.remove("is-leaving");
      root.classList.remove("skip-settling");
      return;
    }

    introUtilities?.classList.add("is-leaving");
    root.classList.add("skip-settling");
    skipHideTimer = schedule(() => {
      skipHideTimer = 0;
      if (state === STATES.INITIAL
        || state === STATES.PLAYING_INTRO
        || state === STATES.SKIPPED_TO_PROJECTS) return;
      skipButton.hidden = true;
      introUtilities?.classList.remove("is-leaving");
      root.classList.remove("skip-settling");
    }, motionReduced ? 0 : 180);
  }

  function updateState(nextState) {
    if (nextState === state && stage.dataset.state === nextState) return;
    state = nextState;
    stage.dataset.state = nextState;
    root.classList.toggle("intro-locked", nextState === STATES.PLAYING_INTRO || nextState === STATES.SKIPPED_TO_PROJECTS);
    root.classList.toggle("detail-locked", nextState === STATES.PROJECT_DETAIL);
    const canInteract = nextState === STATES.PROJECT_STAGE || nextState === STATES.REDUCED_MOTION;
    projectTriggers.forEach((trigger) => {
      trigger.setAttribute("aria-disabled", String(!canInteract));
      if (canInteract) trigger.removeAttribute("tabindex");
      else trigger.setAttribute("tabindex", "-1");
    });
    updateSkipUtility(nextState);
  }

  function revealProjectRows({ stagger = false, onComplete = null } = {}) {
    if (!stagger) {
      projectRows.forEach((row) => {
        if (!row.classList.contains("is-revealed")) row.classList.add("is-revealed");
      });
      onComplete?.();
      return;
    }

    if (projectRows.length === 0) {
      onComplete?.();
      return;
    }

    projectRows.forEach((row, index) => {
      const reveal = () => {
        if (stage.dataset.projectPhase !== "list") return;
        row.classList.add("is-revealed");
      };
      if (index === 0) reveal();
      else scheduleTimeline(reveal, index * TIMING.LIST_ROW_STAGGER);
    });

    const finalRowStart = (projectRows.length - 1) * TIMING.LIST_ROW_STAGGER;
    scheduleTimeline(() => {
      if (stage.dataset.projectPhase !== "list") return;
      onComplete?.();
    }, finalRowStart + TIMING.LIST_ROW_SETTLE);
  }

  function revealAllProjects({ onComplete = null } = {}) {
    if (stage.dataset.projectPhase === "list") {
      revealProjectRows({ onComplete });
      return;
    }
    const shouldAnimateResolution = state === STATES.PLAYING_INTRO
      && stage.dataset.projectPhase === "reel"
      && !motionReduced
      && buildSentence
      && buildHeading;
    const previousHeadingRect = shouldAnimateResolution
      ? buildHeading.getBoundingClientRect()
      : null;

    stage.classList.toggle("is-resolving-list", Boolean(shouldAnimateResolution));
    stage.classList.remove("is-settling-heading", "is-settling-list");
    if (shouldAnimateResolution) {
      buildSentence.style.setProperty("--sentence-shift", "0px");
      buildSentence.style.setProperty("--sentence-shift-y", "0px");
    } else {
      stage.classList.remove("is-settling-list");
      buildSentence?.style.removeProperty("--sentence-shift");
      buildSentence?.style.removeProperty("--sentence-shift-y");
    }
    stage.dataset.projectPhase = "list";
    clearReelWordStates();
    if (!shouldAnimateResolution) {
      revealProjectRows({ onComplete });
    }

    if (!shouldAnimateResolution) return;
    const resolvedHeadingRect = buildHeading.getBoundingClientRect();
    const invertedShift = previousHeadingRect.left - resolvedHeadingRect.left;
    const invertedShiftY = previousHeadingRect.top - resolvedHeadingRect.top;
    buildSentence.style.setProperty("--sentence-shift", `${Math.round(invertedShift * 100) / 100}px`);
    buildSentence.style.setProperty("--sentence-shift-y", `${Math.round(invertedShiftY * 100) / 100}px`);
    buildSentence.getBoundingClientRect();
    win.requestAnimationFrame(() => {
      if (stage.dataset.projectPhase !== "list") return;
      stage.classList.remove("is-resolving-list");
      stage.classList.add("is-settling-heading");
      buildSentence.style.setProperty("--sentence-shift", "0px");
      buildSentence.style.setProperty("--sentence-shift-y", "0px");
      scheduleTimeline(() => {
        if (stage.dataset.projectPhase !== "list") return;
        stage.classList.remove("is-settling-heading");
        buildSentence.style.removeProperty("--sentence-shift");
        buildSentence.style.removeProperty("--sentence-shift-y");
        stage.classList.add("is-settling-list");
        revealProjectRows({
          stagger: true,
          onComplete: () => {
            if (stage.dataset.projectPhase === "list") {
              stage.classList.remove("is-resolving-list", "is-settling-heading", "is-settling-list");
              onComplete?.();
            }
          }
        });
      }, TIMING.LIST_HEADING_SETTLE);
    });
  }

  function resetProjectSequence() {
    stage.dataset.projectPhase = "idle";
    delete stage.dataset.reelIndex;
    activeReelIndex = 0;
    sentenceShifts = [];
    stage.classList.remove("is-resolving-list", "is-settling-heading", "is-settling-list");
    buildSentence?.style.removeProperty("--sentence-shift");
    buildSentence?.style.removeProperty("--sentence-shift-y");
    clearReelWordStates();
    projectRows.forEach((row) => row.classList.remove("is-revealed"));
  }

  function focusFirstProject() {
    projectTriggers[0]?.focus({ preventScroll: true });
  }

  function finishIntro(nextState = STATES.PROJECT_STAGE, {
    focusProjects = false,
    instant = false,
    onReady = null,
    preserveScroll = false,
    statusMessage = "Introduction complete. Projects are ready to explore."
  } = {}) {
    clearTimeline();
    resetIntroPlaybackPause({
      cancelAnimations: instant || nextState === STATES.REDUCED_MOTION || motionReduced
    });
    detachIntroGestureGuards();
    setScene("build");
    const projectsResolved = stage.dataset.projectPhase === "list"
      && projectRows.every((row) => row.classList.contains("is-revealed"));
    if (!projectsResolved) revealAllProjects();
    stage.classList.remove("is-resolving-list", "is-settling-heading", "is-settling-list");
    markPlayedInThisTab(sessionStorage, win);
    const shouldFocusProjects = focusProjects || doc.activeElement === skipButton;
    if (instant) stage.classList.add("is-instant");

    const finishReadyState = () => {
      updateState(nextState);
      root.classList.remove("canvas-settling");
      setPortfolioInteraction(true);
      setStatus(statusMessage);
      if (shouldFocusProjects) focusFirstProject();
      win.requestAnimationFrame(() => stage.classList.remove("is-instant"));
      onReady?.();
      scheduleRouteReconcile();
    };

    if (nextState === STATES.REDUCED_MOTION || motionReduced) {
      motionReduced = true;
      deactivateCanvas();
      stage.classList.add("motion-bypassed");
      if (!preserveScroll) win.scrollTo({ top: stage.offsetTop, behavior: "auto" });
      finishReadyState();
      return;
    }

    stage.classList.remove("motion-bypassed");
    root.classList.add("canvas-settling");
    activateCanvasBeforePaint({
      onReady: finishReadyState
    });
  }

  function skipIntro({ source = "control", focusProjects = false } = {}) {
    if (state !== STATES.PLAYING_INTRO) return;
    updateState(transition(state, EVENTS.SKIP_INTRO));
    finishIntro(transition(STATES.SKIPPED_TO_PROJECTS, EVENTS.SETTLE_AFTER_SKIP), {
      focusProjects,
      instant: true,
      statusMessage: source === "control"
        ? "Introduction skipped. Selected projects are ready."
        : "Introduction completed from your input. Selected projects are ready."
    });
  }

  function playIntro() {
    clearTimeline();
    resetIntroPlaybackPause({ cancelAnimations: true });
    deactivateCanvas();
    stage.classList.remove("motion-bypassed");
    updateState(STATES.PLAYING_INTRO);
    setPortfolioInteraction(false);
    attachIntroGestureGuards();
    setScene("hello");
    resetProjectSequence();
    projectTriggers.forEach((trigger) => trigger.setAttribute("aria-expanded", "false"));

    scheduleTimeline(() => { setScene("school"); }, TIMING.SCHOOL);
    scheduleTimeline(() => {
      if (state !== STATES.PLAYING_INTRO || stage.dataset.projectPhase === "list") return;
      measureProjectReel();
      win.requestAnimationFrame(() => {
        if (state !== STATES.PLAYING_INTRO || stage.dataset.projectPhase === "list") return;
        setActiveReelWord(0);
      });
    }, Math.max(0, TIMING.BUILD - 50));
    scheduleTimeline(() => { setScene("build"); }, TIMING.BUILD);
    scheduleTimeline(() => {
      stage.dataset.projectPhase = "reel";
      showReelWord(0);
    }, TIMING.REEL_START);
    reelWords.slice(1).forEach((_word, index) => {
      const reelIndex = index + 1;
      scheduleTimeline(() => showReelWord(reelIndex), TIMING.REEL_START + (reelIndex * TIMING.REEL_ITEM));
    });
    scheduleTimeline(() => {
      revealAllProjects({
        onComplete: () => {
          if (state === STATES.PLAYING_INTRO && stage.dataset.projectPhase === "list") {
            finishIntro(STATES.PROJECT_STAGE);
          }
        }
      });
    }, TIMING.LIST_RESOLVE);
    if (doc.hidden) pauseIntroPlayback();
  }

  function primeIntro() {
    clearTimeline();
    deactivateCanvas();
    state = STATES.INITIAL;
    stage.dataset.state = STATES.INITIAL;
    setScene("hello");
    resetProjectSequence();
    stage.classList.add("is-instant");
    root.classList.add("intro-locked");
    root.classList.remove("detail-locked");
    projectTriggers.forEach((trigger) => trigger.setAttribute("aria-expanded", "false"));
    win.scrollTo({ top: stage.offsetTop, behavior: "auto" });
    win.requestAnimationFrame(() => {
      win.requestAnimationFrame(() => {
        stage.classList.remove("is-instant");
        playIntro();
      });
    });
  }

  function fillCollectionDetail() {
    const evidenceNodes = DATA_COLLECTION_EVIDENCE.map((item) => {
      const group = doc.createElement("div");
      const term = doc.createElement("dt");
      const description = doc.createElement("dd");
      term.textContent = item.label;
      description.textContent = item.kind;
      group.append(term, description);
      return group;
    });
    detailCollectionEvidence.replaceChildren(...evidenceNodes);

    const collectorNodes = DATA_COLLECTION_PROJECTS.map((collector) => {
      const item = doc.createElement("li");
      const article = doc.createElement("article");
      const heading = doc.createElement("div");
      const title = doc.createElement("h4");
      const stat = doc.createElement("p");
      const statValue = doc.createElement("strong");
      const statKind = doc.createElement("span");
      const summary = doc.createElement("p");
      const scope = doc.createElement("p");
      const source = doc.createElement("p");

      article.className = "collector-entry";
      heading.className = "collector-heading";
      stat.className = "collector-stat";
      summary.className = "collector-summary";
      scope.className = "collector-scope";
      source.className = "collector-source";
      title.textContent = collector.label;
      statValue.textContent = collector.historicalStat.display;
      statKind.textContent = collector.historicalStat.kind;
      summary.textContent = collector.summary;
      scope.textContent = collector.scope;
      source.textContent = collector.sourceLabel;
      stat.append(statValue, statKind);
      heading.append(title, stat);
      article.append(heading, summary, scope, source);
      item.append(article);
      return item;
    });
    detailCollectorList.replaceChildren(...collectorNodes);
  }

  function fillDetail(project) {
    const projectIndex = PROJECTS.findIndex((candidate) => candidate.id === project.id);
    const isCollection = project.type === "collection";
    detailTitle.textContent = project.label;
    detailDescription.textContent = project.description;
    detailMetric.textContent = project.metric;
    detailMetricNote.textContent = project.metricNote || "";
    detailProvenance.textContent = project.provenance || "";
    detailPosition.textContent = projectIndex >= 0 ? `${projectIndex + 1} of ${PROJECTS.length}` : "";
    detailPitch.textContent = project.pitch;
    detailHighlights.replaceChildren(...project.highlights.map((highlight) => {
      const li = doc.createElement("li");
      li.textContent = highlight;
      return li;
    }));
    detailHighlights.hidden = isCollection || project.highlights.length === 0;

    detailLayout.classList.toggle("is-collection", isCollection);
    detailCollection.hidden = !isCollection;
    detailAside.hidden = isCollection;
    if (isCollection) fillCollectionDetail();

    detailStack.replaceChildren(...project.stack.map((item) => {
      const li = doc.createElement("li");
      li.textContent = item;
      return li;
    }));

    detailLinks.replaceChildren(...project.links.map((link) => {
      const anchor = doc.createElement("a");
      anchor.href = link.href;
      anchor.append(`${link.label} ↗`);
      const newTabText = doc.createElement("span");
      newTabText.className = "sr-only";
      newTabText.textContent = " (opens in a new tab)";
      anchor.append(newTabText);
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      return anchor;
    }));
    detailLinks.hidden = project.links.length === 0;
  }

  function clearDetail() {
    detailTitle.textContent = "Project details";
    detailDescription.textContent = "";
    detailMetric.textContent = "";
    detailMetricNote.textContent = "";
    detailProvenance.textContent = "";
    detailPosition.textContent = "";
    detailPitch.textContent = "";
    detailHighlights.replaceChildren();
    detailHighlights.hidden = false;
    detailLayout.classList.remove("is-collection");
    detailCollection.hidden = true;
    detailCollectionEvidence.replaceChildren();
    detailCollectorList.replaceChildren();
    detailAside.hidden = false;
    detailStack.replaceChildren();
    detailLinks.replaceChildren();
    detailLinks.hidden = false;
  }

  function replayIntro(event) {
    event?.preventDefault?.();
    clearPlayedInThisTab(sessionStorage, win);
    win.location.assign("/");
  }

  function cancelDetailClose() {
    cancelScheduled(detailCloseTimer);
    detailCloseTimer = 0;
    detailClosing = false;
  }

  function openProject(trigger, { focus = true } = {}) {
    const project = projectsById.get(trigger?.dataset.project);
    const canOpen = state === STATES.PROJECT_STAGE
      || state === STATES.REDUCED_MOTION
      || state === STATES.PROJECT_DETAIL;
    if (!project || !canOpen) return false;

    cancelScheduled(detailFocusTimer);
    cancelDetailClose();
    if (state !== STATES.PROJECT_DETAIL) {
      returnState = motionReduced ? STATES.REDUCED_MOTION : state;
    }
    detailClosing = false;
    activeProjectTrigger = trigger;
    activeProjectId = project.id;
    if (canvasActive) {
      const projectTop = canvasProjectTop();
      if (Math.abs(win.scrollY - projectTop) > 1) {
        win.scrollTo({ top: projectTop, behavior: "auto" });
        updateCanvasCamera();
      }
    }
    fillDetail(project);
    detail.hidden = false;
    detail.scrollTop = 0;

    projectTriggers.forEach((item) => item.setAttribute("aria-expanded", String(item === trigger)));
    setModalIsolation(true);
    updateState(STATES.PROJECT_DETAIL);
    detailFocusTimer = schedule(() => {
      detailFocusTimer = 0;
      detail.classList.add("is-visible");
      if (focus) closeButton.focus({ preventScroll: true });
    }, motionReduced ? 0 : 30);
    setStatus(`${project.label} project details opened.`);
    return true;
  }

  function closeProject({ immediate = false, restoreFocus = true } = {}) {
    if (state !== STATES.PROJECT_DETAIL || detailClosing) return;
    cancelScheduled(detailFocusTimer);
    detailFocusTimer = 0;
    detailClosing = true;
    detail.classList.remove("is-visible");
    const focusTarget = activeProjectTrigger;
    projectTriggers.forEach((trigger) => trigger.setAttribute("aria-expanded", "false"));
    detailCloseTimer = schedule(() => {
      detailCloseTimer = 0;
      setModalIsolation(false);
      detail.hidden = true;
      clearDetail();
      activeProjectId = null;
      detailClosing = false;
      updateState(transition(STATES.PROJECT_DETAIL, EVENTS.CLOSE_PROJECT, { returnState }));
      setPortfolioInteraction(true);
      if (restoreFocus) focusTarget?.focus({ preventScroll: true });
      activeProjectTrigger = null;
      setStatus("Returned to the project list.");
      scheduleRouteReconcile();
    }, immediate || motionReduced ? 0 : 280);
  }

  function requestProjectClose() {
    const route = parseRoute();
    const managedRoute = win.history.state?.portfolioRoute;
    if (route.kind === "project"
      && managedRoute?.kind === "project"
      && managedRoute.projectId === activeProjectId) {
      win.history.back();
      return;
    }
    if (route.kind === "project") replaceRoute("base");
    closeProject();
  }

  function navigateToProject(trigger) {
    const projectId = trigger?.dataset.project;
    const project = projectsById.get(projectId);
    if (!project || trigger.getAttribute("aria-disabled") === "true") return;
    win.history.pushState(routeState("project", projectId), "", projectHash(projectId));
    openProject(trigger);
  }

  function settleAtProjectStage({ focusProjects = false, statusMessage = "Projects are ready to explore." } = {}) {
    if (state === STATES.PROJECT_DETAIL) {
      closeProject({ immediate: true, restoreFocus: false });
      return;
    }

    routeScrollSettling = true;
    const nextState = motionReduced ? STATES.REDUCED_MOTION : STATES.PROJECT_STAGE;
    updateState(nextState);
    returnState = nextState;
    setPortfolioInteraction(true);
    stage.classList.toggle("motion-bypassed", motionReduced);

    const finish = () => {
      if (motionReduced) {
        win.scrollTo({ top: stage.offsetTop, behavior: "auto" });
      } else {
        win.scrollTo({ top: canvasProjectTop(), behavior: "auto" });
        updateCanvasCamera();
      }
      if (focusProjects) focusFirstProject();
      setStatus(statusMessage);
      win.requestAnimationFrame(() => { routeScrollSettling = false; });
    };

    if (motionReduced) {
      deactivateCanvas();
      finish();
    } else if (canvasActive) {
      finish();
    } else {
      activateCanvas({ onReady: finish });
    }
  }

  function settleAtStaticPage({
    statusMessage = "Profile and contact links are in view."
  } = {}) {
    if (state === STATES.PROJECT_DETAIL) {
      closeProject({ immediate: true, restoreFocus: false });
      return;
    }

    routeScrollSettling = true;
    updateState(STATES.STATIC_PAGE);
    setPortfolioInteraction(true);
    stage.classList.toggle("motion-bypassed", motionReduced);
    const finish = () => {
      win.scrollTo({ top: staticSite.offsetTop, behavior: "auto" });
      setStatus(statusMessage);
      win.requestAnimationFrame(() => { routeScrollSettling = false; });
    };

    if (motionReduced) {
      deactivateCanvas();
      finish();
    } else if (canvasActive) {
      finish();
    } else {
      activateCanvas({ settleAtProjects: false, onReady: finish });
    }
  }

  function reconcileRoute() {
    routeFrame = 0;
    const route = parseRoute();

    if (route.kind === "other") return;
    if (route.kind === "invalid") {
      replaceRoute("base");
      if (state === STATES.PROJECT_DETAIL) {
        closeProject({ immediate: true, restoreFocus: false });
      } else if (state !== STATES.PLAYING_INTRO && state !== STATES.INITIAL) {
        settleAtProjectStage({ statusMessage: "That project could not be found. Selected projects are ready." });
      }
      return;
    }

    if (route.kind === "legacyDataCollection") {
      replaceRoute("project", "data-collection");
      scheduleRouteReconcile();
      return;
    }

    if ((state === STATES.INITIAL || state === STATES.PLAYING_INTRO || state === STATES.SKIPPED_TO_PROJECTS)
      && (route.kind === "project" || route.kind === "static")) {
      finishIntro(motionReduced ? STATES.REDUCED_MOTION : STATES.PROJECT_STAGE, {
        instant: true,
        statusMessage: "Introduction bypassed for the requested portfolio section."
      });
      return;
    }

    if (route.kind === "project") {
      if (state === STATES.STATIC_PAGE) {
        settleAtProjectStage();
        scheduleRouteReconcile();
        return;
      }
      const trigger = projectTriggers.find((candidate) => candidate.dataset.project === route.projectId);
      if (!trigger) {
        replaceRoute("base");
        settleAtProjectStage({ statusMessage: "That project could not be found. Selected projects are ready." });
        return;
      }
      if (state === STATES.PROJECT_DETAIL && activeProjectId === route.projectId) return;
      openProject(trigger, { focus: true });
      return;
    }

    if (route.kind === "static") {
      const managedRoute = win.history.state?.portfolioRoute;
      if (managedRoute?.kind !== "static") replaceRoute("static");
      settleAtStaticPage();
      return;
    }

    if (state === STATES.PROJECT_DETAIL) {
      closeProject({ immediate: motionReduced, restoreFocus: true });
    } else if (state === STATES.STATIC_PAGE) {
      settleAtProjectStage();
    }
  }

  function scheduleRouteReconcile() {
    if (routeFrame) return;
    routeFrame = win.requestAnimationFrame(reconcileRoute);
  }

  function attachIntroGestureGuards() {
    if (introGestureGuardsActive) return;
    introGestureGuardsActive = true;
    win.addEventListener("wheel", onWheel, { passive: true });
    win.addEventListener("touchstart", onTouchStart, { passive: true });
    win.addEventListener("touchmove", onTouchMove, { passive: true });
    win.addEventListener("touchend", resetTouchIntent, { passive: true });
    win.addEventListener("touchcancel", resetTouchIntent, { passive: true });
  }

  function resetWheelIntent() {
    wheelIntentTotal = 0;
    wheelIntentAt = 0;
    wheelIntentDirection = 0;
  }

  function resetTouchIntent() {
    touchStartX = null;
    touchStartY = null;
  }

  function detachIntroGestureGuards() {
    if (!introGestureGuardsActive) return;
    introGestureGuardsActive = false;
    resetWheelIntent();
    resetTouchIntent();
    win.removeEventListener("wheel", onWheel);
    win.removeEventListener("touchstart", onTouchStart);
    win.removeEventListener("touchmove", onTouchMove);
    win.removeEventListener("touchend", resetTouchIntent);
    win.removeEventListener("touchcancel", resetTouchIntent);
  }

  function wheelDeltaInPixels(event) {
    const multiplier = event.deltaMode === 1
      ? 16
      : event.deltaMode === 2
        ? Math.max(win.innerHeight, 1)
        : 1;
    return (Number(event.deltaY) || 0) * multiplier;
  }

  function recordWheelIntent(deltaY) {
    const direction = Math.sign(deltaY);
    const now = Date.now();
    if (direction <= 0 || Math.abs(deltaY) < 1.5) {
      if (direction < 0) resetWheelIntent();
      return false;
    }
    if (now - wheelIntentAt > WHEEL_INTENT_WINDOW || wheelIntentDirection !== direction) {
      wheelIntentTotal = 0;
    }
    const previousTotal = wheelIntentTotal;
    wheelIntentTotal += deltaY;
    wheelIntentAt = now;
    wheelIntentDirection = direction;
    return isMeaningfulWheel(deltaY, previousTotal);
  }

  function onWheel(event) {
    if (event.ctrlKey || event.metaKey) return;
    if (state === STATES.PLAYING_INTRO && recordWheelIntent(wheelDeltaInPixels(event))) {
      skipIntro({ source: "wheel" });
    }
  }

  function onTouchStart(event) {
    if (state !== STATES.PLAYING_INTRO || event.touches.length !== 1) {
      resetTouchIntent();
      return;
    }
    touchStartX = event.touches[0]?.clientX ?? null;
    touchStartY = event.touches[0]?.clientY ?? null;
  }

  function onTouchMove(event) {
    if (event.touches.length !== 1) {
      resetTouchIntent();
      return;
    }
    if (root.classList.contains("canvas-settling")) return;
    if (state !== STATES.PLAYING_INTRO || touchStartX === null || touchStartY === null) return;
    const nextX = event.touches[0]?.clientX ?? touchStartX;
    const nextY = event.touches[0]?.clientY ?? touchStartY;
    const horizontalDistance = Math.abs(nextX - touchStartX);
    const upwardDistance = touchStartY - nextY;
    if (upwardDistance >= TOUCH_INTENT_THRESHOLD && upwardDistance >= horizontalDistance * 1.2) {
      resetTouchIntent();
      skipIntro({ source: "touch" });
    }
  }

  function onKeyDown(event) {
    if (state === STATES.PROJECT_DETAIL && event.key === "Escape") {
      event.preventDefault();
      requestProjectClose();
      return;
    }
    if (state === STATES.PROJECT_DETAIL && event.key === "Tab") {
      const focusables = Array.from(detail.querySelectorAll("button, a[href]"))
        .filter((element) => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length > 0);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && doc.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
    const bodyOwnsFocus = event.target === doc.body || event.target === root;
    const skipKey = ["PageDown", "ArrowDown", "End", "Escape"].includes(event.key)
      || (event.key === " " && bodyOwnsFocus);
    if (state === STATES.PLAYING_INTRO && skipKey) {
      event.preventDefault();
      skipIntro({ source: "keyboard" });
    }
  }

  function onProjectClick(event) {
    event.preventDefault();
    navigateToProject(event.currentTarget);
  }

  function onSkipNavigation(event) {
    event.preventDefault();
    if (state === STATES.PLAYING_INTRO) {
      skipIntro({ source: "navigation", focusProjects: true });
      return;
    }
    if (state === STATES.PROJECT_DETAIL) closeProject({ immediate: true, restoreFocus: false });
    replaceRoute("base");
    settleAtProjectStage({
      focusProjects: true,
      statusMessage: "Selected projects are ready."
    });
  }

  projectTriggers.forEach((trigger) => trigger.addEventListener("click", onProjectClick));
  reelWords.forEach((word) => word.addEventListener("animationend", onReelAnimationEnd));
  skipButton?.addEventListener("click", () => skipIntro({ source: "control", focusProjects: true }));
  skipNavigation?.addEventListener("click", onSkipNavigation);
  replayLink?.addEventListener("click", replayIntro);
  closeButton.addEventListener("click", requestProjectClose);
  detail.addEventListener("click", (event) => {
    if (event.target === detail) requestProjectClose();
  });
  win.addEventListener("keydown", onKeyDown);
  win.addEventListener("resize", scheduleViewportLayout, { passive: true });
  win.addEventListener("scroll", onCanvasScroll, { passive: true });
  win.addEventListener("orientationchange", scheduleViewportLayout, { passive: true });
  win.addEventListener("popstate", scheduleRouteReconcile);
  win.addEventListener("hashchange", scheduleRouteReconcile);
  doc.addEventListener("visibilitychange", onVisibilityChange);
  win.addEventListener("pagehide", pauseIntroPlayback);
  win.addEventListener("pageshow", onPageShow);
  if (win.visualViewport) {
    win.visualViewport.addEventListener("resize", scheduleViewportLayout, { passive: true });
  }
  reducedMotionQuery.addEventListener?.("change", (event) => {
    const nextMotionReduced = event.matches;
    if (nextMotionReduced === motionReduced) return;
    const wasStatic = state === STATES.STATIC_PAGE;
    const preservedStaticOffset = wasStatic
      ? Math.max(0, -staticSite.getBoundingClientRect().top)
      : 0;
    motionReduced = nextMotionReduced;

    if (motionReduced) {
      resetIntroPlaybackPause({ cancelAnimations: true });
      if (state === STATES.INITIAL || state === STATES.PLAYING_INTRO || state === STATES.SKIPPED_TO_PROJECTS) {
        finishIntro(STATES.REDUCED_MOTION, {
          instant: true,
          statusMessage: "Reduced motion is enabled. Projects are ready to explore."
        });
        return;
      }
      deactivateCanvas();
      stage.classList.add("motion-bypassed");
      if (state === STATES.PROJECT_DETAIL) {
        returnState = STATES.REDUCED_MOTION;
      } else if (!wasStatic) {
        updateState(STATES.REDUCED_MOTION);
      }
      win.requestAnimationFrame(() => {
        const top = wasStatic
          ? staticSite.offsetTop + preservedStaticOffset
          : stage.offsetTop;
        win.scrollTo({ top, behavior: "auto" });
        scheduleRouteReconcile();
      });
      setStatus("Reduced motion is enabled. Motion transitions are bypassed.");
      return;
    }

    stage.classList.remove("motion-bypassed");
    if (state === STATES.PROJECT_DETAIL) {
      returnState = STATES.PROJECT_STAGE;
      activateCanvas({
        onReady: () => {
          win.scrollTo({ top: canvasProjectTop(), behavior: "auto" });
          updateCanvasCamera();
        }
      });
    } else if (wasStatic) {
      activateCanvas({
        settleAtProjects: false,
        onReady: () => {
          win.scrollTo({ top: staticSite.offsetTop + preservedStaticOffset, behavior: "auto" });
          updateState(STATES.STATIC_PAGE);
          scheduleRouteReconcile();
        }
      });
    } else {
      updateState(STATES.PROJECT_STAGE);
      activateCanvas({ onReady: scheduleRouteReconcile });
    }
    setStatus("Full motion is enabled. Projects are ready to explore.");
  });

  if ("IntersectionObserver" in win) {
    const observer = new win.IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target !== staticSite
          || routeScrollSettling
          || layoutScrollSettling
          || state === STATES.PROJECT_DETAIL
          || state === STATES.PLAYING_INTRO
          || state === STATES.INITIAL) return;
        const staticRect = staticSite.getBoundingClientRect();
        const bandTop = win.innerHeight * 0.45;
        const bandBottom = win.innerHeight * 0.55;
        const intersectsCurrentBand = staticRect.top < bandBottom && staticRect.bottom > bandTop;
        if (intersectsCurrentBand) {
          updateState(transition(state, EVENTS.ENTER_STATIC));
        } else if (state === STATES.STATIC_PAGE) {
          const returnTo = motionReduced
            ? STATES.REDUCED_MOTION
            : transition(state, EVENTS.RETURN_TO_STAGE);
          updateState(returnTo);
          if (parseRoute().kind === "static") replaceRoute("base");
          setStatus("Returned to the introduction canvas.");
        }
      });
    }, { threshold: 0, rootMargin: "-45% 0px -45% 0px" });
    observer.observe(staticSite);
  }

  const replayRequested = new win.URLSearchParams(win.location.search).get("replay") === "1";
  if (replayRequested) {
    clearPlayedInThisTab(sessionStorage, win);
  }
  let initialRoute = parseRoute();
  if (initialRoute.kind === "invalid") replaceRoute("base");
  if (initialRoute.kind === "legacyDataCollection") {
    replaceRoute("project", "data-collection");
    initialRoute = parseRoute();
  }
  if (initialRoute.kind === "project") seedDirectProjectRoute(initialRoute.projectId);
  const shouldBypassIntro = initialRoute.kind === "project"
    || initialRoute.kind === "static";
  const initialState = transition(STATES.INITIAL, EVENTS.START, {
    reducedMotion: motionReduced,
    hasPlayed: !replayRequested && (hasPlayedInThisTab(sessionStorage, win.name) || shouldBypassIntro)
  });

  if (shouldBypassIntro) markPlayedInThisTab(sessionStorage, win);

  if (initialState === STATES.PLAYING_INTRO) {
    primeIntro();
  } else {
    stage.classList.add("is-instant");
    setScene("build");
    revealAllProjects();
    updateState(initialState);
    setPortfolioInteraction(true);
    if (initialState === STATES.REDUCED_MOTION) {
      stage.classList.add("motion-bypassed");
      deactivateCanvas();
      win.scrollTo({ top: stage.offsetTop, behavior: "auto" });
      scheduleRouteReconcile();
    } else {
      stage.classList.remove("motion-bypassed");
      activateCanvas({
        settleAtProjects: initialRoute.kind !== "static",
        onReady: scheduleRouteReconcile
      });
    }
    setStatus(initialState === STATES.REDUCED_MOTION
      ? "Reduced motion is enabled. Projects are ready to explore."
      : "Projects are ready to explore.");
    win.requestAnimationFrame(() => {
      win.requestAnimationFrame(() => stage.classList.remove("is-instant"));
    });
  }

  root.classList.remove("no-js");
  root.classList.add("has-js", "intro-ready");
  win.__portfolioIntroFallback?.cancel?.();
  scheduleViewportLayout({ type: "initial", force: true });
  win.addEventListener("load", scheduleViewportLayout, { once: true });
  if (doc.fonts?.ready) {
    doc.fonts.ready
      .then(() => {
        scheduleViewportLayout({ type: "fonts", force: true });
      })
      .catch(() => {});
  }

  return Object.freeze({
    getState: () => state,
    skipIntro,
    closeProject,
    replayIntro
  });
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  createIntroExperience();
}

export { createIntroExperience };
