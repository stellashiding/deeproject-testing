import { APP_CONFIG, CORE_FAILURE_TAGS, RHCA_CORE, SCENARIOS } from "./config.js";
import { getState, mutate, recordEvent, ensureTrajectory } from "./state.js";

const esc = value => String(value ?? "").replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
const scenario = () => SCENARIOS.find(item => item.id === getState().currentScenarioId) || SCENARIOS[0];
function autoRhcaProposal(item) { const p=item.prototypeEvaluation; return {scores:p.scores,tags:p.tags,onset:p.onset,recovery:p.recovery,confidence:"medium",rationale:[`Checks whether the user's simplification request is retained after ${p.onset}.`,`Localizes the first configured failure signal to ${p.onset}.`,`Looks for restoration of missing concepts or steps by ${p.recovery}.`]}; }

function writeHumanTrajectory(state) {
  const evaluations = state.turnEvaluations[state.currentScenarioId] || {};
  const frameworkCriteria = state.framework.criteria || [];
  const targets = [state.activeEvaluationTurn || state.selectedTargets[0]].filter(Boolean);
  targets.forEach(turnId => {
    const existing = evaluations[turnId] || { auto: { ...state.ratings }, llm: { ...state.ratings }, tags: [] };
    const customForTurn = state.customTags.filter(tag => tag.evidenceTurn === turnId).map(tag => tag.label);
    const domainScores = Object.fromEntries(frameworkCriteria.map(criterion => [criterion.name, state.ratings[criterion.relationship] || 2]));
    let trajectoryState = "at-risk";
    if (turnId === state.failureOnset) trajectoryState = "violated";
    if (turnId === state.recoveryTurn) trajectoryState = "recovered";
    evaluations[turnId] = { ...existing, human: { ...state.ratings }, domainScores, tags: [...new Set([...(existing.tags || []), ...state.selectedTags, ...customForTurn])], evidenceTurns: [...state.evidenceTurns], state: trajectoryState, humanUpdatedAt: new Date().toISOString() };
  });
  state.turnEvaluations[state.currentScenarioId] = evaluations;
}

function messageCard(turn) {
  const state = getState();
  const target = state.selectedTargets.includes(turn.id);
  const evidence = state.evidenceTurns.includes(turn.id);
  const selectable = turn.role === "assistant";
  return `<article class="message-card ${turn.role} ${target ? "selected-target" : ""}" data-turn="${turn.id}">
    <div class="message-meta"><span>${turn.role === "user" ? "User" : "Assistant"} ${turn.id}</span><span>Round ${turn.round}</span></div>
    <pre>${esc(turn.text)}</pre>
    <div class="message-actions">
      ${selectable ? `<label><input type="checkbox" data-target="${turn.id}" ${target ? "checked" : ""} ${state.humanEvaluationLocked ? "disabled" : ""}> Evaluate this response</label>` : ""}
      <label><input type="checkbox" data-evidence="${turn.id}" ${evidence ? "checked" : ""} ${state.humanEvaluationLocked ? "disabled" : ""}> Use as evidence</label>
      ${selectable ? `<button class="text-button" data-onset="${turn.id}" ${state.humanEvaluationLocked ? "disabled" : ""}>Mark failure onset</button>` : ""}
    </div>
  </article>`;
}

function dimensionEditor(key, dimension) {
  const state = getState();
  const activeTurn = state.activeEvaluationTurn || state.selectedTargets[0];
  const score = state.turnEvaluations[state.currentScenarioId]?.[activeTurn]?.human?.[key] ?? state.ratings[key];
  return `<fieldset class="dimension-card">
    <legend><b>${key}</b> ${esc(dimension.name)}</legend>
    <p>${esc(dimension.question)}</p>
    <div class="score-options">${[1, 2, 3].map(value => `<label title="${esc(dimension.anchors[value])}"><input type="radio" name="score-${key}" value="${value}" ${score === value ? "checked" : ""} ${state.humanEvaluationLocked ? "disabled" : ""}><span>${value}</span></label>`).join("")}</div>
    <small>${esc(dimension.anchors[score])}</small>
  </fieldset>`;
}

function customTags() {
  const tags = getState().customTags;
  if (!tags.length) return `<p class="empty-copy">No domain-specific tags added yet.</p>`;
  return tags.map((tag, index) => `<div class="custom-tag"><span><b>${esc(tag.label)}</b><small>${esc(tag.dimension)} - ${esc(RHCA_CORE[tag.dimension].name)} - evidence ${esc(tag.evidenceTurn)}</small></span><button data-remove-tag="${index}" class="icon-button" aria-label="Remove ${esc(tag.label)}">×</button></div>`).join("");
}

function renderEvaluationPanel() {
  const state = getState();
  const item = scenario();
  return `<aside class="evaluation-panel">
    <div class="panel-title"><div><span class="eyebrow">Human-guided evaluation</span><h2>Selected turns</h2></div><span class="count-badge">${state.selectedTargets.length}/${APP_CONFIG.maxEvaluationTargets}</span></div>
    <div class="selection-summary">${state.selectedTargets.length ? state.selectedTargets.map(id => `<span>${id}</span>`).join("") : "Select one or more assistant responses."}</div>
    ${state.selectedTargets.length ? `<label class="stacked-label">Active turn to ${state.humanEvaluationLocked ? "inspect" : "rate"}<select id="activeEvaluationTurn">${state.selectedTargets.map(id => `<option value="${id}" ${state.activeEvaluationTurn === id ? "selected" : ""}>${id}</option>`).join("")}</select></label>` : ""}
    ${state.selectedTargets.length < 2 ? `<div class="notice warning">Consistency is cross-turn. Select at least two assistant responses for stronger evidence.</div>` : ""}
    <fieldset class="human-evaluation-form" ${state.humanEvaluationLocked ? "disabled" : ""}>
    <section><div class="section-title"><h3>RHCA core ratings</h3><span>Required</span></div>${Object.entries(RHCA_CORE).map(([key, value]) => dimensionEditor(key, value)).join("")}</section>
    <section><div class="section-title"><h3>Core failure tags</h3><span>Paper-derived</span></div><div class="tag-grid">${CORE_FAILURE_TAGS.map(tag => `<label class="tag-check"><input type="checkbox" data-core-tag="${tag.id}" ${state.selectedTags.includes(tag.id) ? "checked" : ""}><span><b>${esc(tag.label)}</b><small>${tag.dimension}</small></span></label>`).join("")}</div></section>
    <section><div class="section-title"><h3>Domain-specific tags</h3><span>Must map to RHCA</span></div><div id="customTagList">${customTags()}</div>
      <div class="mini-form"><input id="customTagName" placeholder="e.g., Oversimplification" aria-label="Custom tag name"><select id="customTagDimension" aria-label="Related RHCA dimension"><option value="">Related dimension</option>${Object.entries(RHCA_CORE).map(([key, d]) => `<option value="${key}">${key} - ${esc(d.name)}</option>`).join("")}</select><select id="customTagEvidence" aria-label="Evidence turn"><option value="">Evidence turn</option>${item.turns.map(t => `<option value="${t.id}">${t.id}</option>`).join("")}</select><button id="addCustomTag" class="button secondary">Add tag</button></div>
    </section>
    <section><div class="section-title"><h3>Failure timeline</h3><span>Long-horizon</span></div><div class="field-row"><label>Failure onset<select id="failureOnset"><option value="none">No failure</option>${item.turns.filter(t => t.role === "assistant").map(t => `<option value="${t.id}" ${state.failureOnset === t.id ? "selected" : ""}>${t.id}</option>`).join("")}</select></label><label>Recovery<select id="recoveryTurn"><option value="none">No recovery</option><option value="partial" ${state.recoveryTurn === "partial" ? "selected" : ""}>Partial</option>${item.turns.filter(t => t.role === "assistant").map(t => `<option value="${t.id}" ${state.recoveryTurn === t.id ? "selected" : ""}>${t.id}</option>`).join("")}</select></label></div></section>
    <section><label class="stacked-label">Review note<textarea id="reviewNote" placeholder="Explain the behavioral failure and cite evidence turns.">${esc(state.reviewNote)}</textarea></label></section>
    <div class="decision-actions"><button data-decision="agree" class="button primary">Agree</button><button data-decision="override" class="button secondary">Override</button><button data-decision="needs-review" class="button ghost">Needs review</button></div>
    </fieldset>
    ${state.humanEvaluationLocked
      ? `<div class="locked-evaluation"><b>Human evaluation locked</b><span>The independent baseline has been saved.</span></div><div class="human-lock-actions"><button id="openAutoComparison" class="button secondary">${state.autoComparisonOpened ? "Auto-RHCA comparison opened" : "Compare with Auto-RHCA"}</button></div>`
      : `<div class="human-lock-actions"><button id="lockHumanEvaluation" class="button primary full">Submit & lock human evaluation</button></div>`}
    ${state.humanEvaluationLocked && state.autoComparisonDecision ? `<button id="completeScenario" class="button success full">Complete scenario task</button>` : ""}
  </aside>`;
}

function renderAutoComparison(item) {
  const state = getState();
  if (!state.humanEvaluationLocked || !state.autoComparisonOpened || !state.humanSnapshot) return "";
  const human = state.humanSnapshot;
  const proposal = autoRhcaProposal(item);
  const rows = [
    ["Failure onset", human.failureOnset, proposal.onset],
    ["Recovery", human.recoveryTurn, proposal.recovery],
    ...Object.keys(RHCA_CORE).map(key => [`${key} · ${RHCA_CORE[key].name}`, human.ratings[key], proposal.scores[key]])
  ];
  return `<section class="card auto-comparison-card">
    <div class="section-title"><div><span class="eyebrow">Phase 2 · post-annotation comparison</span><h2>Human × Auto-RHCA</h2><p>The human baseline was locked before this rule-based proposal was revealed.</p></div><span>Prototype probe · not a validated model</span></div>
    <div class="comparison-table-wrapper"><table class="comparison-table"><thead><tr><th>Signal</th><th>Human</th><th>Auto-RHCA</th><th>Result</th></tr></thead><tbody>${rows.map(([label, humanValue, autoValue]) => `<tr><td><b>${esc(label)}</b></td><td>${esc(humanValue)}</td><td>${esc(autoValue)}</td><td class="${humanValue === autoValue ? "comparison-match" : "comparison-disagree"}">${humanValue === autoValue ? "Match" : "Disagree"}</td></tr>`).join("")}</tbody></table></div>
    <div class="proposal-rationale"><b>Transparent rule trace</b><ul>${proposal.rationale.map(text => `<li>${esc(text)}</li>`).join("")}</ul></div>
    <label class="stacked-label">Comparison note<textarea id="autoComparisonNote" placeholder="Why do you accept or reject the automated proposal?">${esc(state.autoComparisonNote)}</textarea></label>
    <div class="auto-comparison-actions"><button data-auto-decision="accept_auto" class="button primary">Accept Auto-RHCA</button><button data-auto-decision="keep_human" class="button secondary">Keep human judgment</button><button data-auto-decision="revise_final" class="button ghost">Revise final decision</button></div>
  </section>`;
}

export function renderScenario(root) {
  const state = getState();
  const item = scenario();
  root.innerHTML = `<div class="page scenario-page">
    <header class="page-header"><div><span class="eyebrow">Task 1 - Guided scenario simulation</span><h1>Evaluate behavior across selected turns</h1><p>Review the full interaction, select the assistant responses that matter, and ground RHCA ratings in evidence.</p></div><select id="scenarioSelect" class="scenario-select" aria-label="Choose scenario">${SCENARIOS.map(s => `<option value="${s.id}" ${s.id === item.id ? "selected" : ""}>${esc(s.title)}</option>`).join("")}</select></header>
    <div class="context-strip"><div><span>Case family</span><b>${esc(item.family)}</b></div><div><span>User</span><b>${esc(item.learner)}</b></div><div><span>Goal</span><b>${esc(item.goal)}</b></div><div>
  <span>Mode</span>
  <b>${Math.max(...item.turns.map(turn => turn.round))} rounds - guided</b>
</div></div>
    <div class="scenario-layout">
      <aside class="context-panel"><span class="eyebrow">Active context</span><h2>Long-horizon constraints</h2>${item.constraints.map(c => `<div class="constraint">✓ ${esc(c)}</div>`).join("")}<h3>Trace capabilities</h3><div class="chip-row">${item.capabilities.map(c => `<span class="chip">${esc(c)}</span>`).join("")}</div>${item.retrieval ? `<h3>Retrieved curriculum</h3>${item.retrieval.map(r => `<div class="retrieval-item">${esc(r)}</div>`).join("")}` : ""}<div class="notice"><b>Evaluation target</b> is the assistant response being rated. <b>Evidence turns</b> can include user or assistant messages.</div></aside>
      <section class="conversation-panel"><div class="conversation-head"><div><span class="eyebrow">${esc(item.subtitle)}</span><h2>${esc(item.title)}</h2></div><div class="legend"><span class="dot target"></span>Target <span class="dot evidence"></span>Evidence</div></div>${item.turns.filter(t => t.round <= state.revealedRound).map(messageCard).join("")}</section>
      ${renderEvaluationPanel()}
    </div>
    ${renderAutoComparison(item)}
  </div>`;
  bindScenarioEvents(root);
}

function bindScenarioEvents(root) {
  const refresh = () => renderScenario(root);
  root.querySelector("#scenarioSelect").addEventListener("change", event => { mutate(s => {
    const item = SCENARIOS.find(x => x.id === event.target.value);
    s.currentScenarioId = item.id;
    s.selectedTargets = [item.prototypeEvaluation.onset, item.prototypeEvaluation.recovery];
    s.activeEvaluationTurn = item.prototypeEvaluation.onset;
    s.evidenceTurns = [];
    s.ratings = { ...item.prototypeEvaluation.scores };
    s.selectedTags = [...item.prototypeEvaluation.tags];
    s.customTags = [];
    s.failureOnset = item.prototypeEvaluation.onset;
    s.recoveryTurn = item.prototypeEvaluation.recovery;
    s.reviewNote = "";
    s.humanEvaluationLocked = false;
    s.humanSnapshot = null;
    s.autoComparisonOpened = false;
    s.autoComparisonDecision = null;
    s.autoComparisonNote = "";
    s.autoComparisonReviewedAt = null;
    s.completed.scenario = false;
  }, "scenario.selected", { id: event.target.value }); ensureTrajectory(event.target.value); refresh(); });

  root.querySelectorAll("[data-target]").forEach(input => input.addEventListener("change", () => { mutate(s => {
    const id = input.dataset.target;
    if (input.checked && s.selectedTargets.length >= APP_CONFIG.maxEvaluationTargets) { input.checked = false; return; }
    s.selectedTargets = input.checked ? [...s.selectedTargets, id] : s.selectedTargets.filter(x => x !== id);
    if (!s.selectedTargets.includes(s.activeEvaluationTurn)) s.activeEvaluationTurn = s.selectedTargets[0] || null;
  }, "evaluation.targets_changed", { turn: input.dataset.target, selected: input.checked }); refresh(); }));

  const activeTurnSelect = root.querySelector("#activeEvaluationTurn");
  if (activeTurnSelect) activeTurnSelect.addEventListener("change", event => { mutate(s => {
    s.activeEvaluationTurn = event.target.value;
    const savedRatings = s.turnEvaluations[s.currentScenarioId]?.[s.activeEvaluationTurn]?.human;
    if (savedRatings) s.ratings = { ...savedRatings };
  }, "evaluation.active_turn_changed", { turnId: event.target.value }); refresh(); });

  root.querySelectorAll("[data-evidence]").forEach(input => input.addEventListener("change", () => { mutate(s => {
    const id = input.dataset.evidence;
    s.evidenceTurns = input.checked ? [...new Set([...s.evidenceTurns, id])] : s.evidenceTurns.filter(x => x !== id);
  }, "evaluation.evidence_changed", { turn: input.dataset.evidence, selected: input.checked }); refresh(); }));

  root.querySelectorAll("[data-onset]").forEach(button => button.addEventListener("click", () => { mutate(s => { s.failureOnset = button.dataset.onset; }, "evaluation.failure_onset_marked", { turn: button.dataset.onset }); refresh(); }));
  root.querySelectorAll("[name^='score-']").forEach(input => input.addEventListener("change", () => { mutate(s => { s.ratings[input.name.slice(-1)] = Number(input.value); writeHumanTrajectory(s); }, "evaluation.rating_changed", { dimension: input.name.slice(-1), score: Number(input.value) }); refresh(); }));
  root.querySelectorAll("[data-core-tag]").forEach(input => input.addEventListener("change", () => mutate(s => { const id = input.dataset.coreTag; s.selectedTags = input.checked ? [...s.selectedTags, id] : s.selectedTags.filter(x => x !== id); }, "evaluation.core_tag_changed", { tag: input.dataset.coreTag, selected: input.checked })));
  root.querySelector("#failureOnset").addEventListener("change", e => mutate(s => { s.failureOnset = e.target.value; }, "evaluation.failure_onset_changed"));
  root.querySelector("#recoveryTurn").addEventListener("change", e => mutate(s => { s.recoveryTurn = e.target.value; }, "evaluation.recovery_changed"));
  root.querySelector("#reviewNote").addEventListener("input", e => mutate(s => { s.reviewNote = e.target.value; }, "evaluation.note_edited", { length: e.target.value.length }));
  root.querySelector("#addCustomTag").addEventListener("click", () => {
    const label = root.querySelector("#customTagName").value.trim();
    const dimension = root.querySelector("#customTagDimension").value;
    const evidenceTurn = root.querySelector("#customTagEvidence").value;
    if (!label || !dimension || !evidenceTurn) return window.dispatchEvent(new CustomEvent("deeproject:toast", { detail: "Custom tags require a name, RHCA dimension, and evidence turn." }));
    mutate(s => { s.customTags.push({ id: crypto.randomUUID(), label, dimension, evidenceTurn, source: "domain_custom" }); writeHumanTrajectory(s); }, "evaluation.custom_tag_added", { label, dimension, evidenceTurn }); refresh();
  });
  root.querySelectorAll("[data-remove-tag]").forEach(button => button.addEventListener("click", () => { mutate(s => s.customTags.splice(Number(button.dataset.removeTag), 1), "evaluation.custom_tag_removed"); refresh(); }));
  root.querySelectorAll("[data-decision]").forEach(button => button.addEventListener("click", () => mutate(s => { s.reviewDecision = button.dataset.decision; }, "evaluation.decision_recorded", { decision: button.dataset.decision })));
  const lockHuman = root.querySelector("#lockHumanEvaluation");
  if (lockHuman) lockHuman.addEventListener("click", () => {
    const current = getState();
    if (!current.selectedTargets.length || !current.evidenceTurns.length) return window.dispatchEvent(new CustomEvent("deeproject:toast", { detail: "Select at least one evaluation target and one evidence turn." }));
    mutate(s => {
      writeHumanTrajectory(s);
      s.humanSnapshot = structuredClone({
        scenarioId: s.currentScenarioId,
        selectedTargets: s.selectedTargets,
        activeEvaluationTurn: s.activeEvaluationTurn,
        evidenceTurns: s.evidenceTurns,
        ratings: s.ratings,
        selectedTags: s.selectedTags,
        customTags: s.customTags,
        failureOnset: s.failureOnset,
        recoveryTurn: s.recoveryTurn,
        reviewNote: s.reviewNote,
        reviewDecision: s.reviewDecision,
        submittedAt: new Date().toISOString()
      });
      s.humanEvaluationLocked = true;
    }, "human_evaluation.locked", { scenarioId: current.currentScenarioId });
    refresh();
  });

  const openComparison = root.querySelector("#openAutoComparison");
  if (openComparison) openComparison.addEventListener("click", () => {
    mutate(s => { s.autoComparisonOpened = true; }, "automation.comparison_opened", { engine: "transparent_rules_v0" });
    refresh();
  });

  const comparisonNote = root.querySelector("#autoComparisonNote");
  if (comparisonNote) comparisonNote.addEventListener("input", event => mutate(s => { s.autoComparisonNote = event.target.value; }, "automation.comparison_note_edited", { length: event.target.value.length }));

  root.querySelectorAll("[data-auto-decision]").forEach(button => button.addEventListener("click", () => {
    mutate(s => {
      s.autoComparisonDecision = button.dataset.autoDecision;
      s.autoComparisonReviewedAt = new Date().toISOString();
    }, "automation.comparison_decided", { decision: button.dataset.autoDecision, engine: "transparent_rules_v0" });
    refresh();
  }));

  const completeScenario = root.querySelector("#completeScenario");
  if (completeScenario) completeScenario.addEventListener("click", () => {
    const s = getState();
    if (!s.humanEvaluationLocked || !s.autoComparisonDecision) return window.dispatchEvent(new CustomEvent("deeproject:toast", { detail: "Lock the human evaluation and record an Auto-RHCA comparison decision first." }));
    mutate(x => { x.completed.scenario = true; writeHumanTrajectory(x); }, "task.scenario_completed", { targets: s.selectedTargets.length, evidence: s.evidenceTurns.length });
    window.dispatchEvent(new CustomEvent("deeproject:toast", { detail: "Scenario task completed." }));
  });
  recordEvent("view.scenario_opened");
}

