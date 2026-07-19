# Deeproject

Deeproject is a behavioral assurance platform for improving human-facing AI systems.

Many evaluation tools focus on individual responses, aggregate scores, or system traces. Deeproject focuses on what happens across an interaction: when an AI system begins to lose the user's goal or constraints, whether the problem continues, and whether later responses recover successfully.

## Why Deeproject

Deeproject helps teams:

- discover multi-turn behavioral problems earlier;
- connect evaluation decisions to specific interaction evidence;
- identify where a problem begins and how it changes over time;
- move more quickly from evaluation to targeted improvement;
- turn validated failures into reusable evaluation and training artifacts;
- improve the quality of AI development and testing.

The intended workflow is:

```text
Interaction
→ behavioral evaluation
→ human validation
→ targeted improvement
→ reusable data artifact
```

## User-study prototype

This repository contains a frontend-only prototype for workflow testing and product research.

The prototype includes:

- multi-turn scenario review;
- user-selected evaluation and evidence turns;
- behavioral ratings and failure tags;
- domain-framework customization;
- long-horizon trajectory visualization;
- human review and comparison workflows;
- governance and disagreement review;
- structured study export.

Study records remain in the participant's browser until they export the study record. This prototype is intended for research and demonstration, not production deployment.

## Run locally

From the project directory:

```bash
python3 -m http.server 8003
```

Then open:

```text
http://localhost:8003
```

Use a different port if `8003` is already in use.

## Publish with GitHub Pages

1. Place the project files in a GitHub repository.
2. Push the files to the `main` branch.
3. Open **Settings → Pages**.
4. Select **Deploy from a branch**.
5. Choose `main` and `/(root)`.
6. Save the configuration.

The published site will normally appear at:

```text
https://USERNAME.github.io/REPOSITORY/
```

## Status

Deeproject is under active development. The current prototype is being used to evaluate the workflow before production infrastructure and integrations are added.
