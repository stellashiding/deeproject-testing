export const APP_CONFIG = {
  version: "0.8-frontend",
  storageMode: "local",
  apiBaseUrl: "/api/v1",
  maxEvaluationTargets: 5,
  requiredTasks: ["scenario", "framework"]
};

export const RHCA_CORE = {
  R: {
    name: "Reasoning Transparency",
    question: "Does the response explain why and how in a way the user can follow?",
    anchors: {
      1: "No explanation, incorrect reasoning, or hallucinated information.",
      2: "Some explanation, but incomplete, unclear, overly long, or missing key steps.",
      3: "Clear, logical explanation that the user can understand and follow."
    }
  },
  H: {
    name: "Helpfulness",
    question: "Does the response help the user move forward on the task?",
    anchors: {
      1: "Incorrect or unhelpful; no actionable support.",
      2: "Some useful guidance, but incomplete or weakly connected to the task.",
      3: "Clear, accurate, actionable guidance that enables progress."
    }
  },
  C: {
    name: "Consistency",
    question: "Is the response consistent with itself and prior context?",
    anchors: {
      1: "Contradictory or unstable and fails to incorporate prior context.",
      2: "Minor inconsistency or incomplete connection to prior turns.",
      3: "Stable, coherent, and appropriately incorporates prior interactions."
    }
  },
  A: {
    name: "Context Alignment",
    question: "Does the response understand and address the user's intent and context?",
    anchors: {
      1: "Misses the user's goal or introduces irrelevant or misleading content.",
      2: "Addresses part of the request but misses important context.",
      3: "Fully addresses the goal and fits the ongoing interaction."
    }
  }
};

export const CORE_FAILURE_TAGS = [
  { id: "vague_explanation", label: "Vague explanation", dimension: "R" },
  { id: "missing_reasoning", label: "Missing reasoning", dimension: "R" },
  { id: "wrong_diagnosis", label: "Wrong diagnosis", dimension: "H" },
  { id: "no_clear_steps", label: "No clear steps", dimension: "H" },
  { id: "misleading_suggestion", label: "Misleading suggestion", dimension: "H" },
  { id: "inconsistent_behavior", label: "Inconsistent behavior", dimension: "C" },
  { id: "ignores_context", label: "Ignores context", dimension: "A" },
  { id: "misreads_intent", label: "Misreads intent", dimension: "A" },
  { id: "too_generic", label: "Too generic", dimension: "A" }
];

export const FRAMEWORK_TEMPLATES = {
  python_learning: {
    name: "Python Learning Assistant",
    domain: "Programming education",
    examples: [
      {
        name: "Appropriate Simplification",
        relationship: "H",
        definition: "Measures whether simplification reduces cognitive load without removing information required for understanding or progress.",
        evidence: "Identify the learner's stated knowledge, the requested level of simplicity, and any essential concept omitted or preserved.",
        anchors: {
          1: "Removes essential concepts or steps, leaving the learner unable to understand or continue.",
          2: "Reduces complexity but omits some useful explanation or requires follow-up clarification.",
          3: "Uses simple language while preserving the concepts and steps needed for independent progress."
        },
        tags: "oversimplification, missing prerequisite"
      }
    ]
  },
  earsketch: {
    name: "EarSketch Curriculum-RAG",
    domain: "Creative computing education",
    examples: [
      {
        name: "Curriculum Grounding",
        relationship: "A",
        definition: "Measures whether retrieved curriculum is relevant to the learner's immediate coding and music task.",
        evidence: "Compare the user goal, retrieved curriculum section, EarSketch API use, and final guidance.",
        anchors: {
          1: "Uses irrelevant or incorrect curriculum and misdirects the learner.",
          2: "Uses partially relevant curriculum but misses learner level or task details.",
          3: "Uses relevant curriculum and connects it directly to the learner's code and goal."
        },
        tags: "curriculum mismatch, learner-level mismatch"
      }
    ]
  },
  custom: { name: "Custom Domain", domain: "User-defined", examples: [] }
};

const pythonTurns = [
  { id: "U1", round: 1, role: "user", text: "I'm new to Python. How do I use a loop with a list?" },
  { id: "A1", round: 1, role: "assistant", text: "In Python, lists are mutable ordered collections implementing the sequence protocol. You can iterate using enumerate(), list comprehensions, generators, or range-based indexing.\n\nitems = [\"apple\", \"banana\", \"orange\"]\nfor index, value in enumerate(items):\n    print(f\"{index}: {value}\")\n\nThe iterator protocol internally calls iter() and next() until StopIteration is raised." },
  { id: "U2", round: 2, role: "user", text: "That is too complicated. Can you explain it more simply?" },
  { id: "A2", round: 2, role: "assistant", text: "A loop repeats something.\n\nfor item in items:\n    print(item)" },
  { id: "U3", round: 3, role: "user", text: "What are 'item' and 'items'? I don't know where they came from." },
  { id: "A3", round: 3, role: "assistant", text: "'items' is the list, and 'item' is one value from the list.\n\nitems = [\"apple\", \"banana\", \"orange\"]\nfor item in items:\n    print(item)" },
  { id: "U4", round: 4, role: "user", text: "Can you explain what happens each time the loop runs? Please keep it simple." },
  { id: "A4", round: 4, role: "assistant", text: "Yes.\n\n1. Python takes the first value, 'apple', and calls it item.\n2. It prints 'apple'.\n3. Python takes the next value, 'banana', and calls it item.\n4. It continues until the list is finished.\n\nSo item means 'the current value.'" },
  { id: "U5", round: 5, role: "user", text: "If I change the list to numbers, will the same loop still work?" },
  { id: "A5", round: 5, role: "assistant", text: "Yes. The loop works the same way:\n\nnumbers = [2, 4, 6]\nfor number in numbers:\n    print(number)\n\nEach time the loop runs, number stores one value from the list: first 2, then 4, then 6." }
];

const earsketchTurns = [
  { id: "U1", round: 1, role: "user", text: "How do I use a list in Python?" },
  { id: "A1", round: 1, role: "assistant", text: "A list stores several values in order. Example: sounds = [sound_a, sound_b, sound_c]. You can access one sound with sounds[0]." },
  { id: "U2", round: 2, role: "user", text: "How do I use fitMedia with this sound list? sounds = [sound_a, sound_b, sound_c]" },
  { id: "A2", round: 2, role: "assistant", text: "You can pass the whole list to fitMedia: fitMedia(sounds, 1, 1, 5)." },
  { id: "U3", round: 3, role: "user", text: "This doesn't work in my code. fitMedia(sounds, 1, 1, 5) gives an error." },
  { id: "A3", round: 3, role: "assistant", text: "fitMedia expects one sound constant, not the entire list. Use a loop and pass each sound separately, choosing a start and end measure for each item." },
  { id: "U4", round: 4, role: "user", text: "Can you show pseudocode first? I want each sound to play for one measure." },
  { id: "A4", round: 4, role: "assistant", text: "Pseudocode:\n1. Start at measure 1.\n2. For each sound in the list, place that sound for one measure.\n3. Move the start measure forward by one.\n4. Stop after the last sound." },
  { id: "U5", round: 5, role: "user", text: "Now show the simplest code version." },
  { id: "A5", round: 5, role: "assistant", text: "start = 1\nfor sound in sounds:\n    fitMedia(sound, 1, start, start + 1)\n    start = start + 1" }
];

export const SCENARIOS = [
  {
    id: "python-lists-loops",
    family: "General Generative AI Assistant",
    title: "Learning Python Lists and Loops",
    subtitle: "Five-round failure and recovery scenario",
    learner: "Beginner Python learner",
    goal: "Understand how a loop processes each value in a list",
    constraints: ["Use simple language", "Explain one concept at a time", "Preserve essential information", "Avoid advanced syntax"],
    capabilities: ["text", "code", "multi-turn"],
    turns: pythonTurns,
    prototypeEvaluation: {
      scores: { R: 2, H: 2, C: 2, A: 2 },
      tags: ["missing_reasoning", "no_clear_steps"],
      onset: "A2",
      recovery: "A4",
      note: "A2 responds to the simplicity request but removes the definitions needed to understand the example."
    },
    comparators: [
      { name: "Prototype Auto-RHCA", role: "prototype evaluator", result: "Flags A2; recovery at A4" },
      { name: "Constraint rules", role: "deterministic check", result: "Simplicity preference retained" },
      { name: "LLM comparator", role: "research baseline only", result: "Rates A2 as acceptable" },
      { name: "Human reference", role: "review authority", result: "A2 omits essential concepts" }
    ]
  },
  {
    id: "earsketch-lists-fitmedia",
    family: "EarSketch Curriculum-RAG Assistant",
    title: "Lists and fitMedia",
    subtitle: "Curriculum retrieval, API correction, and scaffolding",
    learner: "Beginner EarSketch learner",
    goal: "Use a list of sounds with fitMedia",
    constraints: ["Use curriculum-aligned guidance", "Give pseudocode when requested", "Use beginner-level EarSketch APIs", "Preserve the learner's sound list"],
    capabilities: ["text", "code", "curriculum RAG", "multi-turn"],
    retrieval: ["Python Lists - EarSketch Curriculum", "fitMedia API Reference", "Loops and Iteration Activity"],
    turns: earsketchTurns,
    prototypeEvaluation: {
      scores: { R: 2, H: 1, C: 2, A: 2 },
      tags: ["wrong_diagnosis", "misleading_suggestion"],
      onset: "A2",
      recovery: "A3",
      note: "A2 incorrectly passes a list where fitMedia expects one sound constant; later turns recover with a loop."
    },
    comparators: [
      { name: "Prototype Auto-RHCA", role: "prototype evaluator", result: "Flags incorrect API guidance" },
      { name: "Curriculum rule", role: "deterministic check", result: "fitMedia signature mismatch" },
      { name: "LLM comparator", role: "research baseline only", result: "Inconsistent across turns" },
      { name: "Human reference", role: "review authority", result: "Misleading suggestion at A2" }
    ]
  }
];

export const INTEGRATION_PREVIEW = {
  available: ["Import configured scenarios", "Export study JSON", "Local draft recovery", "Structured event log"],
  planned: ["OpenTelemetry ingestion", "Automatic RHCA service", "CI/CD quality gates"]
};

export const TRAJECTORY_PRESETS = {
  "python-lists-loops": {
    turns: {
      A1: { human: { R: 2, H: 2, C: 3, A: 2 }, auto: { R: 2, H: 2, C: 3, A: 2 }, llm: { R: 3, H: 3, C: 3, A: 3 }, state: "at-risk", tags: ["too_generic"] },
      A2: { human: { R: 1, H: 1, C: 2, A: 1 }, auto: { R: 1, H: 1, C: 2, A: 1 }, llm: { R: 2, H: 3, C: 3, A: 3 }, state: "violated", tags: ["missing_reasoning", "no_clear_steps", "oversimplification", "missing prerequisite"] },
      A3: { human: { R: 2, H: 2, C: 2, A: 2 }, auto: { R: 2, H: 2, C: 2, A: 2 }, llm: { R: 3, H: 3, C: 3, A: 3 }, state: "persistent", tags: ["oversimplification"] },
      A4: { human: { R: 3, H: 3, C: 3, A: 3 }, auto: { R: 3, H: 3, C: 3, A: 3 }, llm: { R: 3, H: 3, C: 3, A: 3 }, state: "recovered", tags: [] },
      A5: { human: { R: 3, H: 3, C: 3, A: 3 }, auto: { R: 3, H: 3, C: 3, A: 2 }, llm: { R: 3, H: 3, C: 3, A: 3 }, state: "retained", tags: [] }
    },
    prediction: { nextTurn: "A6", rhcaRisk: { R: 0.18, H: 0.24, C: 0.16, A: 0.42 }, tagRisk: { oversimplification: 0.38, "missing prerequisite": 0.24 }, persistence: 0.31, recovery: 0.69, confidence: "medium", source: "prototype_rule_projection" }
  },
  "earsketch-lists-fitmedia": {
    turns: {
      A1: { human: { R: 3, H: 3, C: 3, A: 3 }, auto: { R: 3, H: 3, C: 3, A: 3 }, llm: { R: 3, H: 3, C: 3, A: 3 }, state: "retained", tags: [] },
      A2: { human: { R: 1, H: 1, C: 2, A: 1 }, auto: { R: 1, H: 1, C: 2, A: 1 }, llm: { R: 2, H: 2, C: 3, A: 2 }, state: "violated", tags: ["wrong_diagnosis", "misleading_suggestion", "curriculum mismatch"] },
      A3: { human: { R: 2, H: 3, C: 2, A: 3 }, auto: { R: 2, H: 3, C: 2, A: 3 }, llm: { R: 3, H: 3, C: 2, A: 3 }, state: "recovered", tags: [] },
      A4: { human: { R: 3, H: 3, C: 3, A: 3 }, auto: { R: 3, H: 3, C: 3, A: 3 }, llm: { R: 3, H: 3, C: 3, A: 3 }, state: "retained", tags: [] },
      A5: { human: { R: 3, H: 3, C: 3, A: 3 }, auto: { R: 3, H: 3, C: 3, A: 3 }, llm: { R: 3, H: 3, C: 3, A: 3 }, state: "retained", tags: [] }
    },
    prediction: { nextTurn: "A6", rhcaRisk: { R: 0.14, H: 0.22, C: 0.20, A: 0.29 }, tagRisk: { "curriculum mismatch": 0.27, "API misuse": 0.21 }, persistence: 0.20, recovery: 0.80, confidence: "medium", source: "prototype_rule_projection" }
  }
};
