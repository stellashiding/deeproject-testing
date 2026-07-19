import { APP_CONFIG, FRAMEWORK_TEMPLATES, SCENARIOS, TRAJECTORY_PRESETS } from "./config.js";

const clone = value => structuredClone(value);
const defaultCriterion = () => clone(FRAMEWORK_TEMPLATES.python_learning.examples[0]);
const initialTrajectory = scenarioId => clone(TRAJECTORY_PRESETS[scenarioId] || { turns: {}, prediction: null });

const initialState = () => {
  const scenarioId = SCENARIOS[0].id;
  const trajectory = initialTrajectory(scenarioId);
  return {
    route: "scenario",
    participantId: "",
    participantProfile: { identityType: "participant_id", email: null, role: "AI evaluation researcher", domain: "" },
    studySessionId: crypto.randomUUID(),
    startedAt: new Date().toISOString(),
    currentScenarioId: scenarioId,
    revealedRound: 5,
    selectedTargets: ["A2", "A4"],
    activeEvaluationTurn: "A2",
    evidenceTurns: ["U2", "A2", "U3", "A4"],
    ratings: { R: 2, H: 2, C: 2, A: 2 },
    selectedTags: ["missing_reasoning", "no_clear_steps"],
    customTags: [],
    failureOnset: "A2",
    recoveryTurn: "A4",
    reviewNote: "",
    reviewDecision: "pending",
    comparatorView: "human",
    humanEvaluationLocked: false,
    humanSnapshot: null,
    autoComparisonOpened: false,
    autoComparisonDecision: null,
    autoComparisonNote: "",
    autoComparisonReviewedAt: null,
    selectedTrajectoryTurn: "A2",
    turnEvaluations: { [scenarioId]: trajectory.turns },
    predictions: { [scenarioId]: trajectory.prediction },
    annotationTeam: [
      { id: crypto.randomUUID(), displayId: "A01", status: "submitted" },
      { id: crypto.randomUUID(), displayId: "A02", status: "submitted" }
    ],
    annotations: [{ id: crypto.randomUUID(), annotatorId: "A02", scenarioId, ratings: { R: 2, H: 1, C: 2, A: 2 }, failureTags: ["missing_reasoning"], evidenceTurns: ["U2", "A2"], failureOnset: "A2", recoveryTurn: "A4", status: "submitted", source: "illustrative" }],
    adjudication: { status: "pending", ratings: {}, note: "", updatedAt: null },
    framework: { id: crypto.randomUUID(), name: "Python Learning Assistant Framework", template: "python_learning", domain: "Programming education", coreVersion: "RHCA Core v1.2", criteria: [defaultCriterion()], activeCriterionIndex: 0, status: "draft" },
    curatedArtifacts: [],
    completed: { scenario: false, framework: false },
    events: []
  };
};

let state = initialState();
const subscribers = new Set();

export function getState() { return state; }
export function setState(patch, eventType = "state.updated") { state = { ...state, ...patch }; if (eventType) recordEvent(eventType, Object.keys(patch)); subscribers.forEach(fn => fn(state)); }
export function mutate(mutator, eventType, payload = {}) { mutator(state); if (eventType) recordEvent(eventType, payload); subscribers.forEach(fn => fn(state)); }
export function subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); }

export function recordEvent(type, payload = {}) {
  state.events.push({ eventId: crypto.randomUUID(), sessionId: state.studySessionId, type, timestamp: new Date().toISOString(), route: state.route, scenarioId: state.currentScenarioId, payload });
  window.dispatchEvent(new CustomEvent("deeproject:event", { detail: { type, payload } }));
}

export function ensureTrajectory(scenarioId) {
  state.turnEvaluations ||= {};
  state.predictions ||= {};
  if (!state.turnEvaluations[scenarioId]) {
    const preset = initialTrajectory(scenarioId);
    state.turnEvaluations[scenarioId] = preset.turns;
    state.predictions[scenarioId] = preset.prediction;
  }
}

export function hydrate(saved) {
  if (!saved || typeof saved !== "object") return;
  const defaults = initialState();
  state = { ...defaults, ...saved, events: saved.events || [] };
  if (["governance", "integrations"].includes(state.route)) state.route = "review";
  if (state.participantId === "anonymous") state.participantId = "";
  state.participantProfile = { ...defaults.participantProfile, ...(saved.participantProfile || {}) };
  state.annotationTeam = Array.isArray(saved.annotationTeam) ? saved.annotationTeam : defaults.annotationTeam;
  state.annotations = Array.isArray(saved.annotations) ? saved.annotations : defaults.annotations;
  state.adjudication = typeof saved.adjudication === "object" ? { ...defaults.adjudication, ...saved.adjudication } : { ...defaults.adjudication, status: saved.adjudication || "pending" };
  state.turnEvaluations = { ...defaults.turnEvaluations, ...(saved.turnEvaluations || {}) };
  state.predictions = { ...defaults.predictions, ...(saved.predictions || {}) };
  state.humanEvaluationLocked = Boolean(saved.humanEvaluationLocked);
  state.humanSnapshot = saved.humanSnapshot && typeof saved.humanSnapshot === "object" ? saved.humanSnapshot : null;
  state.autoComparisonOpened = Boolean(saved.autoComparisonOpened);
  state.autoComparisonDecision = saved.autoComparisonDecision || null;
  state.autoComparisonNote = saved.autoComparisonNote || "";
  state.autoComparisonReviewedAt = saved.autoComparisonReviewedAt || null;
  state.framework = { ...defaults.framework, ...(saved.framework || {}) };
  if (!Array.isArray(state.framework.criteria)) state.framework.criteria = [state.framework.criterion || defaultCriterion()];
  state.framework.activeCriterionIndex ??= 0;
  delete state.framework.criterion;
  ensureTrajectory(state.currentScenarioId);
  recordEvent("study.restored");
}

export function reset() { state = initialState(); recordEvent("study.reset"); subscribers.forEach(fn => fn(state)); }

export function studyBundle() {
  return {
    metadata: { product: "Deeproject Behavioral Assurance Prototype", version: APP_CONFIG.version, sessionId: state.studySessionId, participantId: state.participantId, participantProfile: state.participantProfile, startedAt: state.startedAt, exportedAt: new Date().toISOString() },
    taskCompletion: state.completed,
    scenarioReview: { scenarioId: state.currentScenarioId, selectedTargets: state.selectedTargets, evidenceTurns: state.evidenceTurns, ratings: state.ratings, coreFailureTags: state.selectedTags, customFailureTags: state.customTags, failureOnset: state.failureOnset, recoveryTurn: state.recoveryTurn, decision: state.reviewDecision, note: state.reviewNote },
    humanEvaluation: {
      locked: state.humanEvaluationLocked,
      snapshot: state.humanSnapshot
    },
    autoRhcaEvaluation: {
      evaluatorType: "rule_based_prototype",
      validatedModel: false,
      predictions: state.predictions[state.currentScenarioId] || null
    },
    autoRhcaComparison: {
      opened: state.autoComparisonOpened,
      decision: state.autoComparisonDecision,
      note: state.autoComparisonNote,
      reviewedAt: state.autoComparisonReviewedAt
    },
    trajectoryAnalytics: { turnEvaluations: state.turnEvaluations, predictions: state.predictions, comparatorView: state.comparatorView },
    annotationGovernance: { team: state.annotationTeam, annotations: state.annotations, adjudication: state.adjudication },
    frameworkArtifact: state.framework,
    curatedArtifacts: state.curatedArtifacts,
    interactionEvents: state.events
  };
}
