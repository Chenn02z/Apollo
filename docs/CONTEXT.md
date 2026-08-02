# Workspace Context

Canonical Apollo terminology and workflow boundaries. Keep implementation
details out of this file; they belong in specs, `docs/PRODUCT.md`, and
`docs/ARCHITECTURE.md`.

## Canonical Terms

- `Apollo`: the Codex-native project that turns software-engineering topics into
  self-contained, interview-ready slide decks. Under spec 0006 (Verified) it is
  entered through `$getcracked` and produces each deck through `$generate`.
- `$getcracked`: the sole user-facing entry point (Verified in spec 0006). It
  takes a `category` and a topic count, orchestrates research and generation
  internally, and owns the `getcracked inventory`. Users do not invoke research
  or `$generate` separately.
- `$generate`: the deck-authoring workflow, renamed from `$apollo` with no
  alias, shim, or deprecation path. Its lifecycle stays self-contained and
  unchanged: it generates its own `run-id`, creates the `run directory`, authors,
  validates, exports, and retries up to 3 attempts. It lives at
  `.agents/skills/generate/SKILL.md`.
- `run directory`: `runs/<category-slug>/<run-id>/` when `$generate` is
  dispatched with a category (every `$getcracked` run), or `runs/<run-id>/` for
  a standalone `$generate` invocation. It holds every artifact of that run.
- `web-researcher`: the dedicated research agent configured at
  `.codex/agents/apollo/web-researcher.toml`. It supplies research findings
  only — cited, in-session, never written to any file — and makes no workflow
  decisions.
- `getcracked inventory`: `docs/getcracked-inventory.md` — the durable,
  checked-in backlog of topics under seven fixed categories, each entry carrying
  exactly a topic name, a status, and a run link.
- `category`: one of the seven fixed inventory categories — DSA, System Design,
  Software Design, Java & Backend Development, Databases, AI Engineering, Deep
  Learning. An unknown category is rejected, never created.
- `inventory status`: `planned`, `generated`, or `reviewed`. `$getcracked` sets
  `planned` on selection and `generated` on per-topic success; `reviewed` is
  reached only by a developer editing the inventory by hand.
- `metadata.md`: the run-scoped `<run-dir>/metadata.md` — a title plus a 1–2
  sentence description — written by `$getcracked` on per-topic success only.
- `topic`: the single software-engineering subject one deck covers. Under spec
  0006 topics are selected by `$getcracked` from research findings and recorded
  in the inventory rather than supplied one at a time.
- `deck` / `deck.html`: the one standalone offline HTML file Apollo produces.
- `slide`: one top-level unit of the deck; the MVP requires exactly ten.
- `first-frame template`: the checked-in standalone 1080×1350 source slide `templates/first-frame.html`, used only for slide 1. It carries a fixed category/topic/commentary presentation with no body-safe area. It owns the fixed rail and rotated `get cracked` label and keeps the header and footer fixed. The first frame is fixed; the author does not restyle it.
- `frame template`: the checked-in standalone 1080×1350 source slide `templates/frame.html`, used for slides 2–10, filling each slide’s
  CSS-sized `<div id="body-safe-area">` with free body composition. It owns the
  fixed rail and rotated `get cracked` label and keeps the header and footer
  fixed. The frame is fixed; the author does not restyle it. Its `<div id="body-safe-area">`
  supports the still-live `archetype-*` class family (e.g. `archetype-hero`,
  `archetype-split`, `archetype-grid`) for body-layout variation; those classes are
  the frame's contract for slides 2–10 and are not obsolete.
- `body-safe area`: the CSS-sized `<div id="body-safe-area">` each repeated slide
  carries for author content. The author composes body content freely within it
  (`free body composition`); the header and footer stay fixed.
- `manifest`: the checked-in configuration that sets independent
  `content revision limit` and `visual revision limit`, each 0–5.
- `content review`: an advisory check that the deck gives a correct explanation,
  a concrete example, a trade-off or failure mode, and interview-ready Q/A for
  mid-level generalists. It reports feedback to the author; the author revises.
- `visual review`: an advisory check that reads the rendered PNGs for frame
  integrity, legibility, and collisions. It reports feedback to the author; the
  author revises.
- `review report`: the run-scoped output written under
  `<run-dir>/reviews/content` and `<run-dir>/reviews/visual`. On revision
  exhaustion the run still delivers with these reports; review is advisory, not a
  blocking gate. Structural validation and PNG export remain the only hard gates.
- `pedagogical order`: the fixed ten-step sequence every deck follows — hook,
  definition, mental model, mechanics, flow, applied example, code/pseudocode,
  trade-off, misconception/failure, interviewer follow-up. It is a model-authored
  content-planning artifact, not input to a fixed layout engine, and is distinct
  from the `frame template`.
- `PNG export`: the ten 1080×1350 PNGs named `slide-01.png` through
  `slide-10.png` that Apollo produces from `deck.html`.
- `identity floor`: the Apollo-specific editorial-study-notes character every
  deck must share, defined in the `frontend-design` skill. Apollo locks a
  `hybrid visual system` (below): the frame, palette, and typography roles are
  fixed while slide structures and content stay free. It is an identity floor,
  not a full layout recipe. The `apollo-designer` runs the two-pass
  `frontend-design` process and holds this floor with its Breaks-if guardrails
  as hard failures. (Historical breadcrumb: this two-pass process replaced the
  obsolete "eight anchors" instruction.)
- `hybrid visual system`: the settled Apollo visual contract for future runs
  (existing historical runs are untouched). Fixed: the frame; a seven-color
  palette (`#1C1C1C`, `#506B62`, `#A85F47`, `#5D7094`, `#A9824F`, `#806277`,
  `#8E6A58`) with no fixed semantic color roles; three typography roles —
  Georgia for editorial heading/body, a system sans for component headings,
  and SF Mono/Menlo for labels/code, with only treatments varying; and a fixed
  rail of an 8px accent rail plus a vertical rotated `get cracked` brand label
  (no topic-specific rail label) that never overlaps body content. Slide 10 is
  always a center-center full follow-up composition. Free: per-slide structures,
  content, and graphics, with no fixed motif and no required component library.
- `validity contract`: the MVP rules a deck must satisfy — exactly 10 top-level
  slides; no external assets or network dependencies; no interactivity or
  animation; each slide 1080×1350 CSS px; overflow detected; exactly 10
  correctly sized PNGs with predictable numbering.
- `fails clean`: Apollo stops and reports an error rather than deliver incomplete
  or invalid output.
- `reference HTML`: `docs/reference/index.html`, visual guidance only; untracked
  and preserved; not a dependency and not copied.
- `runs/` / `run-id`: the local, gitignored generated-output directory and the
  unique identifier for one deck run, generated by the deck workflow itself.
  Each new run writes its artifacts to its own `run directory` (its `deck.html`,
  `metadata.md`, and `slide-01.png` … `slide-10.png`); there is no shared or cwd
  output folder. The historical flat `runs/run-*/` directories — including the
  four seeded inventory runs — and the legacy flat `runs/deck.html` are
  preserved as-is.
- `MVP boundary`: the line between full delivery (one deck, ten coherent slides,
  ten PNGs) and post-MVP features. Drives architecture seams.
- `post-MVP`: explicitly deferred features — web/editor UI, API/local-model
  integrations, batching, publishing, analytics, video/audio, PDF, accounts,
  cloud, automatic factual-review pipeline.
- Workflow terms from the underlying harness (`skill`, `spec`, `milestone`,
  `phase`, `Accepted`, `Verified`, `context maintenance`) keep their meanings
  from `docs/WORKFLOWS.md` and `docs/AGENT_ROLES.md`.

## Product Boundaries

- Codex is the authoring surface. `$generate` delegates deck-body composition to
  the dedicated `.codex/agents/apollo/apollo-designer.toml` agent (not a
  generic worker/implementer); the design agent owns only
  `<run-dir>/deck.html` and does not alter templates, while the main
  workflow retains run setup, manifest validation, structural validation, retry
  orchestration, and PNG export. Apollo has no external model, no API
  integration, and no multi-agent runtime orchestration beyond this narrowly
  scoped design-agent routing and the `$getcracked` orchestration boundary.
- `$getcracked` is the sole user-facing entry point (Verified in spec 0006).
  It takes a category and a count, uses `web-researcher` to
  select that exact count of normalized-unique topics, appends them to the
  inventory as `planned`, and dispatches one `$generate` per topic.
  `$generate` keeps its existing self-contained lifecycle; `$getcracked` never
  reaches inside it.
- Research is an input, never a decision-maker. `web-researcher` supplies cited
  in-session findings to `$getcracked` (topic selection) and `$generate`
  (content grounding); it edits no files and makes no workflow decisions.
- Per-topic isolation is the failure boundary. A failed topic stays `planned`,
  gets no `metadata.md`, is reported, and does not block sibling topics.
- The authoring model is whatever Codex already provides; Apollo does not
  configure or call a separate model/API.
- There is no product runtime to run or deploy in the MVP. Delivery happens
  inside a Codex session.
- The reference HTML is guidance, not code to reuse; do not copy its external
  assets.
- Two checked-in standalone 1080×1350 source slides build the deck:
  `templates/first-frame.html` for slide 1 (a fixed category/topic/commentary
  presentation with no body-safe area) and `templates/frame.html` for slides
  2–10, filling each slide's CSS-sized `<div id="body-safe-area">` while the
  locked header, footer, rail, rotated `get cracked` label, visual feel, type,
  and colors stay fixed; the author has free body composition within each safe
  area. Content and visual review are advisory and driven by the
  `manifest` revision limits; only structural validation and PNG export are hard
  gates. The author, not the reviewer, revises the deck HTML.

## Workflow Boundaries

- `grilling` is pre-requirements discovery, not spec review; `spec-griller`
  owns the later concrete-spec quality gate. A grilling session must not hand
  off to `$requirements` until outcome, non-goals, constraints, and verifiable
  success criteria can be stated without invention.
- `$requirements` must not draft while material intent, terminology, success
  criteria, or constraints remain unanswered. If `$grilling` has not settled
  them, the handoff stays Draft.
- Orchestration and deck authoring are separate layers. `$getcracked` owns
  inventory reads and writes, topic selection, per-topic `$generate` dispatch,
  `metadata.md` writes, sequential inventory updates, and per-topic failure
  reporting. `$generate` owns one deck end to end and is never partially
  driven from outside.

## Run Layout And Output

- `runs/` is local, gitignored generated output. Every deck run has a unique
  `run-id` generated by the deck workflow itself; all of that run's artifacts
  (its `deck.html` and `slide-01.png` … `slide-10.png`) live under its
  `run directory`. Under spec 0006 (Verified) a successful run also carries a
  `$getcracked`-written `metadata.md`.
- New runs are category-scoped: every `$getcracked`-dispatched run lands under
  `runs/<category-slug>/<run-id>/`. Only a standalone `$generate` invocation
  without a category still writes a flat `runs/<run-id>/`.
- There is no shared or cwd output folder. New runs never write to a common
  directory; the per-run layout keeps outputs isolated and reviewable.
- Historical flat runs are kept untouched: the four seeded `runs/run-*/`
  directories keep their flat inventory links, and the legacy flat
  `runs/deck.html` remains as pre-0002 evidence of the earlier single-file
  layout. Neither is moved, rewritten, or overwritten by per-run output.

## Local Commands

- No project-specific CLI or runtime command exists yet. Apollo is invoked as a
  Codex workflow, not a runnable binary. Spec 0006 (Verified) settles
  `$getcracked` at
  `.agents/skills/getcracked/SKILL.md` as the sole user-facing entry point and
  renames the deck workflow to `$generate` at
  `.agents/skills/generate/SKILL.md`. The deck workflow
  delegates deck-body composition to the dedicated
  `.codex/agents/apollo/apollo-designer.toml` agent (not a generic
  worker/implementer). The design agent owns only `<run-dir>/deck.html` and
  does not alter templates; the deck workflow retains run setup, manifest
  validation, structural validation, retry orchestration, and PNG export, and
  `templates/frame.html` stays immutable. The implementer role otherwise builds
  support tooling only.
- PNG export and validation use local Node Playwright tooling. The pipeline runs the
  structural validator `scripts/check-deck.py` (validator strengthened by 0005's slide-1 routing gate) against
  `<run-dir>/deck.html`, then `node scripts/export-carousel.mjs <run-id> [--category <slug>]`
  rasterizes slides 1–10 into `<run-dir>/slide-01.png` through
  `slide-10.png` and validates exact count and 1080×1350 image dimensions.
  `--category` is passed for every `$getcracked`-dispatched run so the export
  lands in the category-scoped run directory. Network is disabled and the
  viewport is 1080×1350 at device scale 1; the exporter fails clean with a clear
  nonzero error and no partial slide PNGs on any breach. The invocation is
  settled in milestone 0002 (Verified); 0006 added only the `--category`
  argument.
- `.agent-trace/` and the harness workflow skills remain available; they are
  harness-level, not Apollo product features.

## Documentation Map

- `README.md`: public Apollo overview.
- `docs/PRODUCT.md`: product intent, scope, principles, roadmap.
- `docs/ARCHITECTURE.md`: current structure, approved seams, deferred architecture.
- `docs/WORKFLOWS.md`: skill workflow and status contract (unchanged).
- `docs/AGENT_ROLES.md`: subagent roles and routing, plus the `apollo-designer`
  and `web-researcher` agent-routing decisions.
- `docs/DOCS_POLICY.md`: documentation destinations and status rules (unchanged).
- `docs/CONTEXT.md`: this file — canonical terminology and boundaries.
- `docs/getcracked-inventory.md`: the durable topic backlog.
- `user-journeys.html`: visual map of the current Apollo path.
