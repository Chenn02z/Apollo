# Milestone: First-Frame Template Composition

## Status

Accepted

## Status Notes

- **Accepted by user:** milestone 0004 renumbered into the accepted slot for
  first-frame / template composition; prior Draft review milestones (content,
  0005; visual, 0006) are pushed back one slot. Spec authoring may start;
  implementation is not yet authorized.
- **Contract clarified by user (pre-spec):** the fixed palette, fixed
  typography roles, the template-owned rail plus rotated `get cracked` label,
  slide 10 follow-up placement, and generic body-layout variation language are
  settled below. This revision retains Status: Accepted.

## Goal

Split Apollo's locked visual frame into two immutable standalone templates so
slide 1 (the first frame) carries a fixed presentation — exactly a
category, topic, and commentary — while slides 2–10 keep the free body
composition introduced by milestone 0003. This settles the contract for which
first-frame elements are template-fixed versus agent-authored, and confirms the
rail and rotated `get cracked` label are owned by the templates and never varied
per deck.

## MVP Deliverable

Two checked-in standalone slide templates exist and are consumed by `$apollo`
authoring:

- `templates/first-frame.html`: one standalone 1080×1350 source slide used
  **only** for slide 1.
- `templates/frame.html`: one standalone 1080×1350 source slide used for slides
  2–10 (extends the milestone 0003 frame).

User-visible outcome: running `$apollo` on a topic produces
`runs/<run-id>/deck.html` as exactly ten 1080×1350 slides where slide 1 uses
`templates/first-frame.html` (fixed first-frame presentation) and slides 2–10
use `templates/frame.html` (free body composition in the safe area). The rail
and rotated `get cracked` label render identically from the templates on every
slide; the
first frame shows exactly category / topic / commentary; all other validity
checks and PNG export from milestone 0001/0002/0003 keep passing.

Verifiable success criteria:

- `templates/first-frame.html` is a single standalone 1080×1350 slide for slide
  1 only, carrying the fixed first-frame presentation with exactly three
  authored slots: category, topic, commentary. The first frame does not carry a
  `#body-safe-area` element or any `archetype-*` class; those belong only to
  `templates/frame.html`.
- `templates/frame.html` remains a single standalone 1080×1350 slide and is used
  for slides 2–10; its `#body-safe-area` element and existing `archetype-*` class
  contract are unchanged from milestone 0003.
- Both templates define the fixed palette as their sole palette tokens, exactly:
  `#1C1C1C`, `#506B62`, `#A85F47`, `#5D7094`, `#A9824F`, `#806277`, `#8E6A58`.
  No new JSON token files are introduced; the templates remain the source of
  truth for color. The two templates deliberately duplicate these seven tokens
  and must be kept in lockstep by hand; no new CI/build abstraction is added to
  synchronize them.
- The first frame's topic renders at the default foreground `#1C1C1C`, wrapping
  naturally; the agent may wrap selected inline words in foreground spans drawn
  solely from the fixed palette above; no other topic styling, color, or
  background is permitted.
- Category and commentary are agent-authored plain text; the agent chooses their
  wording but not their fixed placement, type, or color.
- Typography roles are fixed by the templates: Georgia for editorial heading and
  body type, the system sans stack `system-ui, -apple-system, BlinkMacSystemFont,
  "Segoe UI", Roboto, sans-serif` for component headings, and SF
  Mono/Menlo for labels and code. Both templates fix the first-frame treatments
  within these roles; body treatments on slides 2–10 may vary only within these
  same roles.
- Body content on slides 2–10 carries no fixed semantic color mapping: the agent
  may choose per-deck color meanings drawn only from the fixed palette.
- Every slide's template owns one 8px rail at a fixed position and fixed length,
  plus the rotated `get cracked` label positioned to the rail's left. The rail
  and label are rendered by the template (not the agent) and never overlap body
  content. Their color is chosen by the template from the fixed palette.
- Rails remain template-fixed: no per-deck rail variation is allowed.
- Slide 10 is authored as a center-center follow-up within its safe area; this
  is `$apollo` prompt guidance, not template-enforced layout.
- `$apollo` routes all new decks through the two templates (slide 1 →
  first-frame, slides 2–10 → frame); existing runs under `runs/` are not
  modified.
- The standard 10-slide self-contained contract still holds: exactly ten
  1080×1350 slides, no external assets, no network, no interactivity or
  animation; structural validation and PNG export still pass.
- Reference run `runs/run-bd27fe93-c61c-4c91-a9dc-02936267401f/deck.html`
  remains a valid, unmodified example of the prior single-template output.

## Scenarios

- Author a deck: `$apollo` reads `templates/first-frame.html` for slide 1 and
  `templates/frame.html` for slides 2–10, fills the first frame's category /
  topic / commentary and each body-safe area, and writes ten slides to
  `runs/<run-id>/deck.html`.
- First-frame presentation: slide 1 shows fixed category, default-ink topic (with
  optional fixed-palette inline highlights), and commentary; the rail and
  rotated `get cracked` label render from the template in fixed
  position/length/color, label left of the rail, never overlapping the safe body
  region.
- Body variation: slides 2–10 vary their body layout within the safe area and
  keep to the fixed typography roles; the agent assigns any per-deck color
  meanings only from the fixed palette.
- Follow-up slide: slide 10 is authored as a center-center follow-up within its
  safe area, following `$apollo` prompt guidance rather than a template rule.
- New vs existing: every newly authored deck uses the two templates; the
  reference run and any other existing run are left untouched.
- Self-contained check: validation and PNG export confirm ten 1080×1350
  slides, no external assets, no network, and no interactivity.

## Developer Workflow

Requirements → spec authoring for the first-frame / template-composition
contract, then implementation through `$spec` and `$dev-loop`.

## Decisions

- Apollo's frame splits into two immutable standalone templates:
  `templates/first-frame.html` (slide 1 only) and `templates/frame.html`
  (slides 2–10).
- The fixed palette is exactly `#1C1C1C`, `#506B62`, `#A85F47`, `#5D7094`,
  `#A9824F`, `#806277`, `#8E6A58`. Templates define these as their sole palette
  tokens and remain the source of truth; no new JSON token files are added.
- Body content on slides 2–10 has no fixed semantic color mapping; the agent may
  choose color meanings per deck, drawn only from the fixed palette.
- The first frame is a fixed presentation with exactly three authored slots —
  category, topic, commentary. Category and commentary are agent-authored plain
  text (wording only); topic defaults to `#1C1C1C` and wraps naturally.
- The agent may highlight selected topic words using inline foreground spans
  drawn solely from the fixed palette. These inline highlight spans are
  first-frame-only (the topic slot); no other topic styling, color, or
  background is allowed.
- Typography roles are fixed: Georgia for editorial heading/body, the system sans
  stack `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  sans-serif` for component headings, and SF Mono/Menlo for labels/code.
  Templates fix the first-frame treatments; body treatments may vary only within
  these roles.
- Every slide's template owns one 8px fixed-position, fixed-length rail plus the
  rotated `get cracked` label to its left, rendered by the template (not the
  agent) and never overlapping body content; color is chosen by the template
  from the fixed palette. Rails are template-fixed with no per-deck variation.
- Slide 10 is authored as a center-center follow-up within its safe area via
  `$apollo` prompt guidance; the templates do not enforce this placement.
- All new decks use the two templates; existing runs are not modified. Standard
  self-contained validity, validation, and PNG export from 0001/0002/0003 keep
  passing.
- This milestone deliberately defers editing of template-consumer skill/agent
  instructions and docs; those are updated in later spec implementation.

## In Scope

- Add `templates/first-frame.html` as one standalone 1080×1350 slide for slide 1
  only, with the fixed first-frame presentation (category / topic / commentary).
- Extend `templates/frame.html` (milestone 0003) so it serves slides 2–10 and
  owns the rail and rotated `get cracked` label with the same fixed treatment as
  the first frame; both templates protect the safe body region from chrome.
- During spec implementation, copy the rail plus rotated `get cracked` label
  geometry exactly from the user-supplied reference run
  `runs/run-bd27fe93-c61c-4c91-a9dc-02936267401f/deck.html` into both templates.
  This geometry is not assumed to already exist in `templates/frame.html`; it
  must be transcribed from the reference run.
- Define the fixed palette as the templates' sole palette tokens and fix the
  typography roles in both templates.
- Align `$apollo` authoring to route slide 1 → `first-frame.html` and slides
  2–10 → `frame.html`, leaving existing runs untouched.
- Fix the first-frame contract: fixed category/commentary placement and
  topic default ink with fixed-palette inline highlight spans only.

## Out Of Scope

- Editing the template-consumer `$apollo` skill/agent instructions or related
  docs now — deferred to later spec implementation (named in scope above).
- Changing structural validation or PNG export contracts (owned by 0001/0002).
- The content or visual review behavior and reports (milestones 0005 / 0006).
- Any new manifest fields beyond milestone 0003.
- Any new JSON token files or a color source of truth outside the templates.
- Any fixed semantic color mapping for agent-designed body content.
- Re-authoring, re-rendering, re-exporting, or re-validating existing runs; every
  existing run (including the reference run) stays untouched and needs no
  re-export or revalidation.
- Free composition rules for slides 2–10 beyond the milestone 0003 body-safe
  area contract.

## Architecture Seams

- Sharpens the topic → deck HTML boundary (Seam 1): the two templates are the
  fixed visual contract; the first frame fixes category/topic/commentary
  presentation while slides 2–10 keep the free body-safe-area surface.
- Consumes the milestone 0003 frame/manifest contract; the rail and rotated
  `get cracked` label are template-owned chrome that the body-safe area is
  protected from.
- Defers changes to template-consumer skill/agent instructions to the spec
  implementation phase, keeping this milestone a contract/acceptance boundary.

## Deferred

- Updating template-consumer skill/agent instructions and docs to use the two
  templates (later spec implementation).
- Later implementation touchpoints (named now, edited only during spec
  implementation): `templates/first-frame.html` (new), `templates/frame.html`,
  `.agents/skills/apollo/SKILL.md`, `.codex/agents/apollo/apollo-designer.toml`,
  and the `$apollo` routing path (slide 1 → first-frame, slides 2–10 → frame).
  Validator, exporter, and manifest are unchanged by this milestone.
- During spec implementation, remove only the stale `.archetype-takeaway` prompt
  mention in `.codex/agents/apollo/apollo-designer.toml`. No CSS class is deleted
  from either template.
- Content-review revisions and reports (0005).
- Visual-review revisions and reports (0006).
- Any escalation of review into a hard gate.

## Hard Contract vs Prompt Guidance

Template-fixed (hard contract; not agent-varied):

- The fixed palette (seven colors above) as the templates' sole palette tokens;
  templates are the color source of truth.
- The fixed typography roles (Georgia editorial heading/body; system sans stack
  `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  component headings; SF Mono/Menlo labels/code).
- The first frame's fixed category / topic / commentary presentation, with topic
  defaulting to `#1C1C1C`.
- The 8px fixed-position, fixed-length rail and rotated `get cracked` label,
  rendered by the template and never overlapping body content.

Prompt guidance (agent authoring inputs; not contract guarantees):

- Editorial wording of category and commentary.
- Which topic words, if any, to highlight and which fixed-palette color to use
  for the inline span (first-frame topic slot only).
- Per-deck color meanings for body content, drawn only from the fixed palette.
- Free body-layout variation for slides 2–10 within the safe area and within the
  fixed typography roles.
- Pedagogical content choices for body material.
- Slide 10's center-center follow-up placement within its safe area, expressed as
  prompt guidance to `$apollo`; it is not enforced by the templates.
- The prompt only states not to inject or restyle the rail and its label; the
  rail is not otherwise agent prompt guidance.

## Handoff

- producer skill: `$requirements`
- intended consumer skill: `$spec`
- artifact path: `docs/milestones/0004-first-frame-template-composition.md`
- status: `Accepted`
- settled decisions:
  - Two immutable standalone templates: `templates/first-frame.html` (slide 1)
    and `templates/frame.html` (slides 2–10).
  - Fixed palette = exactly `#1C1C1C`, `#506B62`, `#A85F47`, `#5D7094`,
    `#A9824F`, `#806277`, `#8E6A58`; templates define these as their sole
    palette tokens and remain the source of truth; no new JSON token files.
  - No fixed semantic color mapping for body content; agent chooses per-deck
    meanings only from the fixed palette.
  - First frame fixed presentation = exactly category / topic / commentary;
    category and commentary are agent-authored plain text (wording only).
  - Topic default `#1C1C1C`, natural wrap; allowed inline highlight spans only
    from the fixed palette; no other topic styling/background.
  - Fixed typography roles: Georgia editorial heading/body; system sans
    stack `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    sans-serif` for component headings; SF Mono/Menlo labels/code. Templates fix
    first-frame
    treatments; body may vary treatments only within these roles.
  - Every template owns one 8px fixed-position/fixed-length rail plus rotated
    `get cracked` label to its left, rendered by the template and never
    overlapping body content; rails are template-fixed, no per-deck variation.
  - Slide 10 is authored as a center-center follow-up within its safe area via
    `$apollo` prompt guidance; the templates do not enforce this placement.
  - All new decks use the two templates; existing runs unmodified; standard
    self-contained checks/export still pass.
  - Editing template-consumer skill/agent instructions and docs is deferred to
    spec implementation and is out of scope now.
- unresolved blockers: none
- docs / specs / milestones the next skill must read:
  - `docs/milestones/0003-frame-template-and-manifest-contract.md`
  - `docs/WORKFLOWS.md` (handoff + spec status contract)
  - `docs/ARCHITECTURE.md`
  - proposed spec: `docs/specs/0004-first-frame-template-contract.md`
  - reference run: `runs/run-bd27fe93-c61c-4c91-a9dc-02936267401f/deck.html`
- agent routing log:
  - `requirements`: used
  - `explorer`: not applicable for this scoped renumber/insert pass
  - `spec-planner`: not applicable (spec authoring is the consumer's step)
  - `spec-griller`: not applicable (no spec drafted in this pass)
  - `codex-agent-tracer`: used
- trace path: `.agent-trace/requirements-0004-first-frame`
