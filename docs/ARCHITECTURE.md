# Apollo Architecture

## Current Structure

Apollo has one adaptive 7–10-slide content-to-render workflow. It performs
deterministic structural, overflow, export, and manifest validation. The
workspace also includes a visual/content reference at
`docs/reference/html/index.html`.

The MVP runtime is a local Codex-native staged workflow. Skills enter stages,
a Codex custom agent performs bounded content generation, and deterministic
local tools support rendering and validation. It writes each generation to an
inspectable run directory rather than a database or service; it has no
standalone LLM API client or runtime API key.

## Current Flow

```text
topic → `apollo-generate` → [carousel-writer → validation] × up to 3 → carousel-reviewer → [[candidate writer → validation] × up to 3 → promote → carousel-reviewer] × up to 2 → `apollo-render` → content validation → external snapshot preparation → carousel-art-director (once) → layout/boundary validation → carousel-composer → slide-bodies/ → safe-fragment validation/fixed shell → reserved-body validation → Playwright PNG export → atomic four-member publication (manifest last)

recoverable failure → workflow appends sanitized run-local `recovery-log.jsonl` + workspace-local, untracked `recovery-history.jsonl` → `carousel-recovery` (at most 2 delegations per top-level invocation; repeated signature or exhausted budget stops) → revalidate from valid checkpoint
```

## Current Boundaries

- **Run artifact boundary:** a run directory contains `request.json`,
  `carousel-content.json`, `carousel-layout.json`, `slide-bodies/`, `index.html`,
  `slides/`, and `render-manifest.json` as stages complete; it may also contain
  `carousel-content.initial.json`, `carousel-content.before-revision-2.json`, and versioned
  `carousel-review-1.json` through `carousel-review-3.json` artifacts.
  The renderer atomically publishes `slide-bodies/`, `index.html`, `slides/`,
  and `render-manifest.json` only after every content-derived screenshot
  succeeds, with the manifest last. A failure preserves the prior complete set,
  or leaves no success manifest.
- **Bounded recovery boundary:** the workflow appends sanitized diagnostics
  locally; `recovery-history.jsonl` is workspace-local, untracked, untrusted
  diagnostic memory, not prompt instructions or a publication artifact.
  Generate recovery may write only a
  candidate from a valid checkpoint. Render recovery may write only a
  non-protected `carousel-layout.json` or the exact canonical `slide-bodies/`
  fragments. Initial-content, review, state, protected-boundary, integrity,
  browser, export, and publication errors are terminal. Repeated signatures and
  an exhausted two-delegation-per-top-level-invocation budget stop recovery; art direction and
  composition remain one-shot.
- **Content/layout/HTML boundary:** `carousel-content.json` holds plain-text,
  layout-ready 7–10-slide copy. Its slide array is the sole source of slide
  count, order, and shell-owned topic, number, role, title, why, and glossary
  fields. During composition, `slide.content` is a creative brief.
  `apollo-render` validates content, prepares an external protected-boundary
  snapshot, invokes `carousel-art-director` once to write validated creative
  direction in `carousel-layout.json`, validates the plan and boundary, then
  invokes `carousel-composer` with content, layout direction, and the canonical
  shell to author body copy and arrangement in only the exact `slide-bodies/`
  fragments. The composer does not receive the template contract or theme CSS.
  Deterministic code safely validates and inserts those fragments into one fixed
  local shell whose topic, number, role, title, why, glossary, header, and footer
  remain shell-owned.
- **Theme/HTML boundary:** repository-owned visual assets, including vendored
  fonts, form one local 1080×1350 `database` theme pack. Output has 7–10
  ordered identifiable slides and uses only this pack, with no scripts, network
  access, or external assets. The art director and deterministic runtime retain
  the template and theme inputs. Legacy `cp-*` CSS remains embedded in the
  canonical theme for compatibility but is unreachable to newly validated slide
  bodies because `cp-*` classes are rejected.
- **HTML/export boundary:** the Playwright export step uses aborted network
  routes to deterministically screenshot each assembled slide to PNG; that
  export step does not make visual or content decisions.
- **Validation boundary:** validation reports deterministic dimensions,
  content-derived slide count, and overflow failures independently from content
  generation; it validates structural limits, not semantic concreteness.
- **Review/rewrite boundary:** `carousel-reviewer` evaluates validated content
  and writes a versioned review that Apollo deterministically validates. An
  `approve_with_warnings` or `reject` decision may cause `carousel-writer` to
  write a candidate, with up to three attempts for initial content and each
  candidate. Apollo validates each attempt; validation removes an invalid
  selected artifact, and a failed candidate leaves prior valid content intact.
  It performs at most two revisions and three reviews. A missing or invalid
  review is non-blocking and stops this loop; this stage does not render slides
  or replace deterministic validation.

## Free-Flow Visual-Composition Boundary

`0003-template-archive-and-carousel-art-direction` and
`0004-constrained-slide-composition` remain historical Verified milestones.
`0005-free-flow-slide-bodies` is Verified and defines the live flow:

```text
validated content brief + validated layout direction → carousel-composer
→ slide-bodies/<nn>.html → safe-fragment validation and fixed-shell assembly
→ reserved-body containment → Playwright export → atomic publication
```

- The sole `database-blueprint` template contract is version 2. It retains the
  template identity, theme assets, motif, and layout-capability vocabulary and
  has no `fragmentVocabulary`.
- The art director creates no HTML, cannot alter content, has
  `carousel-layout.json` as its sole write, and is never retried or repaired.
  Deterministic validation still rejects invalid plans and protected-boundary
  writes; a valid plan is creative direction rather than a DOM contract. It
  continues to use the template contract and theme.
- The composer authors final body copy and arrangement only in the exact
  `slide-bodies/<nn>.html` set. Those files are the sole final rendered-body-copy
  artifact. Its source inputs are validated content, validated layout direction,
  and the canonical shell only. New fragments may use arbitrary validated
  nesting, non-legacy classes, and inline layouts without binding,
  claim-fidelity, plan-to-DOM, or arrangement-warning requirements; `cp-*`
  classes are rejected.
- Deterministic code still owns exact shell fields, safe fragment acceptance and
  insertion, the unchanged shell and chrome, visible body containment, network
  abortion, 1080×1350 export, rollback, and manifest-last publication.

`0005` opens body-copy and arrangement authorship while closing new composition
off from the legacy primitive vocabulary. Deterministic safety, shell, export,
rollback, and publication seams remain unchanged.

## Current Body-Utilization Seam

Verified milestone `0006-increase-slide-body-utilization` extends the live
`0005-free-flow-slide-bodies` composition contract:

- Writer briefs carry one concrete core idea plus two distinct, nonredundant
  supports, and the existing reviewer requests revision when
  that semantic minimum is missing.
- The existing `sparse` density means fewer, larger elements distributed
  through the body, while the composer preserves nonredundant teaching points
  and distributes qualifying geometry through at least 70% of body height.
- The composer's existing check and single correction opportunity, plus a fresh
  prepublication check, share the same unrounded qualifying vertical-span
  measurement against canonical staged HTML; `ratio >= 0.70` passes.
- Existing schemas, stages, agents, dependencies, retry and correction counts,
  fixed shell, theme, rollback boundary, and manifest-last publication remain
  unchanged.

## Current Carousel-Treatment Variety Seam

Verified milestone `0007-carousel-treatment-variety` is a prompt-only
extension to the existing art-direction/composition seam:

- The art director assigns carousel-level information treatments and
  reading paths in each existing `directionNote`, avoiding accidental repeats
  when slide semantics permit a distinct treatment.
- The composer implements that direction rather than defaulting to a
  minimum repeated body structure; justified semantic or rhythmic repetition
  remains allowed.
- Existing schemas, agents, pipeline order, validators, retry and correction
  counts, fixed shell, export, rollback, and publication boundaries remain
  unchanged; deterministic code will not judge visual novelty.

## Deferred Architecture

- Research/citation, vision repair, and publishing/scheduling are
  deferred roadmap ideas; no active milestone contract authorizes them.
- An AI theme, theme taxonomy or plugins, unbounded retry or repair loops,
  generated assets, caching, publishing, scheduling, analytics, web UI, authentication, and hosted
  execution are post-MVP.
- `docs/reference/html/index.html` is source material for the local
  `database` theme pack, not raw runtime HTML.
