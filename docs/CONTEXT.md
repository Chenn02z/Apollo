# Workspace Context

Canonical Apollo terminology and workflow boundaries. Keep implementation
details out of this file; they belong in specs, `docs/PRODUCT.md`, and
`docs/ARCHITECTURE.md`.

## Canonical Terms

- `Apollo`: the Codex-native workflow that turns one software-engineering topic
  into a self-contained, interview-ready slide deck.
- `topic`: the single software-engineering subject a user supplies to Apollo.
- `deck` / `deck.html`: the one standalone offline HTML file Apollo produces.
- `slide`: one top-level unit of the deck; the MVP requires exactly ten.
- `pedagogical order`: the fixed ten-step sequence every deck follows — hook,
  definition, mental model, mechanics, flow, applied example, code/pseudocode,
  trade-off, misconception/failure, interviewer follow-up. It is a model-authored
  content-planning artifact, not input to a fixed layout engine.
- `PNG export`: the ten 1080×1350 PNGs named `slide-01.png` through
  `slide-10.png` that Apollo produces from `deck.html`.
- `validity contract`: the MVP rules a deck must satisfy — exactly 10 top-level
  slides; no external assets or network dependencies; no interactivity or
  animation; each slide 1080×1350 CSS px; overflow detected; exactly 10
  correctly sized PNGs with predictable numbering.
- `fails clean`: Apollo stops and reports an error rather than deliver incomplete
  or invalid output.
- `reference HTML`: `docs/reference/index.html`, visual guidance only; untracked
  and preserved; not a dependency and not copied.
- `MVP boundary`: the line between full delivery (one deck, ten coherent slides,
  ten PNGs) and post-MVP features. Drives architecture seams.
- `post-MVP`: explicitly deferred features — web/editor UI, API/local-model
  integrations, batching, publishing, analytics, video/audio, PDF, accounts,
  cloud, automatic factual-review pipeline.
- Workflow terms from the underlying harness (`skill`, `spec`, `milestone`,
  `phase`, `Accepted`, `Verified`, `context maintenance`) keep their meanings
  from `docs/WORKFLOWS.md` and `docs/AGENT_ROLES.md`.

## Product Boundaries

- Codex is the authoring surface. Apollo has no external model, no API
  integration, and no runtime multi-agent orchestration.
- The authoring model is whatever Codex already provides; Apollo does not
  configure or call a separate model/API.
- There is no product runtime to run or deploy in the MVP. Delivery happens
  inside a Codex session.
- The reference HTML is guidance, not code to reuse; do not copy its external
  assets.

## Local Commands And Maturity Gaps

- No project-specific CLI or runtime command exists yet. Apollo is invoked as a
  Codex workflow (`$apollo`), not a runnable binary.
- PNG export and validation depend on local tooling available in the session.
  The only deterministic rendering stage is a local Playwright export script
  that rasterizes slides 1–10 into `slide-01.png` through `slide-10.png` and
  validates exact count and 1080×1350 image dimensions. The precise local
  invocation is a maturity gap to record once the MVP pipeline is built;
  milestone specs must not invent commands.
- `.agent-trace/` and the harness workflow skills remain available; they are
  harness-level, not Apollo product features.

## Documentation Map

- `README.md`: public Apollo overview.
- `docs/PRODUCT.md`: product intent, scope, principles, roadmap.
- `docs/ARCHITECTURE.md`: current structure, approved seams, deferred architecture.
- `docs/WORKFLOWS.md`: skill workflow and status contract (unchanged).
- `docs/AGENT_ROLES.md`: subagent roles and routing (unchanged).
- `docs/DOCS_POLICY.md`: documentation destinations and status rules (unchanged).
- `docs/CONTEXT.md`: this file — canonical terminology and boundaries.
- `user-journeys.html`: visual map of the current Apollo path.
