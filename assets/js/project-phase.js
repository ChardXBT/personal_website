// Declared machine for `data-project-phase` on the intro stage:
// idle -> reel -> list, with a reset back to idle from any phase.

export const PROJECT_PHASES = Object.freeze({
  IDLE: "idle",
  REEL: "reel",
  LIST: "list"
});

const PROJECT_PHASE_TRANSITIONS = Object.freeze({
  [PROJECT_PHASES.IDLE]: Object.freeze([PROJECT_PHASES.REEL, PROJECT_PHASES.LIST]),
  [PROJECT_PHASES.REEL]: Object.freeze([PROJECT_PHASES.IDLE, PROJECT_PHASES.LIST]),
  [PROJECT_PHASES.LIST]: Object.freeze([PROJECT_PHASES.IDLE])
});

export function isProjectPhase(value) {
  switch (value) {
    case PROJECT_PHASES.IDLE:
    case PROJECT_PHASES.REEL:
    case PROJECT_PHASES.LIST:
      return true;
    default:
      return false;
  }
}

export function getProjectPhase(stage) {
  const phase = stage?.dataset?.projectPhase;
  switch (phase) {
    case PROJECT_PHASES.IDLE:
    case PROJECT_PHASES.REEL:
    case PROJECT_PHASES.LIST:
      return phase;
    default:
      throw new Error(`Unknown data-project-phase value: ${String(phase)}`);
  }
}

export function transitionProjectPhase(stage, nextPhase) {
  const currentPhase = getProjectPhase(stage);
  if (!isProjectPhase(nextPhase)) {
    throw new Error(`Unknown target project phase: ${String(nextPhase)}`);
  }
  if (nextPhase !== currentPhase && !PROJECT_PHASE_TRANSITIONS[currentPhase].includes(nextPhase)) {
    throw new Error(`Invalid project phase transition: ${currentPhase} -> ${nextPhase}`);
  }
  stage.dataset.projectPhase = nextPhase;
  return nextPhase;
}
