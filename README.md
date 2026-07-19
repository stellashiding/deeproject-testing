# Deeproject GitHub Pages user-study prototype

This package is the frontend-only research version. It runs on GitHub Pages without Python, FastAPI, MongoDB, or another server.

This revision supports a formative CHI-oriented workflow study and an AAAI-oriented transparent Auto-RHCA technology probe. It adds multi-criterion framework building, rule-based proposals with accept/edit/reject decisions, long-horizon onset/recovery visualization, and an illustrative governance/IRR view. It does not claim trained-model accuracy or true multi-rater IRR without independent annotations.

## What it records

- Required Participant ID or email onboarding
- Role and domain profile
- Scenario turn and evidence selections
- RHCA ratings and failure tags
- Failure onset and recovery
- Domain framework artifact
- Structured interaction events

Records stay in the participant's browser through `localStorage`. At the end of the session, click **Export study record** and collect the downloaded JSON using the method approved by the study protocol.

## Publish with GitHub Pages

1. Create a GitHub repository.
2. Put all files from this folder at the repository root.
3. Push the files to the `main` branch.
4. Open **Settings > Pages**.
5. Under **Build and deployment**, choose **GitHub Actions**.
6. The included workflow publishes the static site.

The site will normally appear at `https://USERNAME.github.io/REPOSITORY/`.

## Local test

```bash
python3 -m http.server 8000
```

Open <http://localhost:8000>.

## Important limitation

There is no centralized database or live researcher monitoring in this version. A participant must export the study JSON before finishing. This version is intended for synchronous formative testing, think-aloud sessions, and artifact collection.
