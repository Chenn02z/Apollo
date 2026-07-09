# Workspace Context

Canonical terminology and workflow boundaries for this product workspace. Keep
implementation details out.

## Canonical Terms

- `workspace`: this repo, its docs, milestone ladder, skills, and future code
  for the local clip-production tool.
- `creator`: the repo owner, currently the only intended user.
- `clip`: one short-form technical education video intended for TikTok-style
  delivery.
- `TikTok-ready clip package`: the exported output bundle containing the final
  video, subtitles in their chosen delivery form, and a thumbnail, ready for
  manual upload.
- `concept`: a vague creator-supplied idea (e.g. "LLMs") that the Concept
  Ideation Agent expands into ranked concrete video topics.
- `Concept Ideation Agent`: the agentic stage (0001) that accepts a `concept`
  and outputs one or more concrete video topics with one-line teaching
  angles. Topic count is configurable via `ideation.topic_count`, defaulting
  to 1. Model: `deepseek/deepseek-v4-flash`.
- `Script Agent`: the agentic stage (0002) that accepts a concrete topic
  (with optional angle seed from 0001) and outputs a `script package`
  containing a refined angle, narration draft, visual beats, and duration
  estimate, plus the target audience. Content is targeted at software developers preparing for
  technical interviews. Model: `deepseek/deepseek-v4-pro`.
- `topic-only intake`: the MVP input contract where `topic` is the only
  required production input. The pipeline may also accept a `concept` as an
  alternative starting point via the Concept Ideation Agent.
- `script package`: the canonical intermediate artifact for one clip produced
  after topic-only intake and script planning, containing the authoritative
  one-clip topic, angle, narration draft, visual-beat plan, duration estimate,
  and target audience consumed by later timeline assembly; distinct from the
  final `TikTok-ready clip package`.
- `narrated timeline draft`: the canonical post-0002, pre-render artifact for
  one clip. Produced by 0003 from the authoritative `script package`, it
  preserves the input narration draft and target audience while adding the
  authoritative timing plan, per-segment `visual instruction` deterministically
  copied from visual beats, and subtitle-ready text later stages consume
  before final render. Downstream narration, subtitle realization, and 0004
  rendering must conform to this timing or fail as a contract error.
- `seed-link grounding`: optional future input of supporting source links or
  materials to steer research and scripting.

- `angle`: a one-line teaching approach attached to a concrete video topic.
  Produced as a seed hint by the Concept Ideation Agent and refined into the
  authoritative teaching angle by the Script Agent. The input `angle` is a
  seed the script agent may override; the output `angle` is authoritative.
- `angle seed`: the `angle` field as provided by the Concept Ideation Agent
  (0001). A hint, not a hard constraint — the Script Agent (0002) may refine
  or replace it.
- `pipe adapter`: the CLI-level adapter that connects the Concept Ideation
  Agent to the Script Agent. When ideation produces multiple topics, it
  selects only the first (top-ranked) topic before feeding 0002. This keeps
  the per-topic contract identical regardless of ideation output count.
- `visual beats`: timed scene descriptions in the script package, each with
  a `timestamp` (M:SS from clip start) and `description`. Consumed by
  timeline assembly as the rendering instruction source.
- `visual instruction`: the per-segment rendering directive in the narrated
  timeline draft. Deterministically copied from the corresponding
  `visual_beats[i].description` by the 0003 CLI; not produced or paraphrased
  by the LLM. Consumed by 0004 as the segment-level key for asset and
  template mapping.
- `visual draft`: canonical 0004 output artifact for one clip: rendered MP4
  plus render manifest, produced from the narrated timeline draft by the
  asset-driven renderer once implemented; distinct from TikTok-ready clip
  package because 0004 omits thumbnail generation, final export packaging,
  and standalone subtitle-file delivery for 0005.
- `asset-driven renderer`: 0004 pipeline stage specified to compose one
  scene per timeline segment by mapping its visual instruction to the
  template vocabulary and emitting the visual draft; no LLM in render path.
- `template vocabulary`: closed set of deterministic render templates
  recognized by the asset-driven renderer; full enumeration lives in
  docs/specs/0004-asset-driven-visual-render.md; fallback_text_card handles
  unmatched visual instruction text.
- `template mapping`: deterministic keyword/regex operation assigning each
  visual instruction to exactly one template; CLI behavior, not LLM
  behavior.
- `render manifest`: per-render `.render.json` emitted beside MP4 recording
  source timeline, optional narration source, output path, duration,
  resolution, codec, and per-segment template/params/warnings.
- `subtitle burn-in`: 0004 delivery form for subtitle output seam where
  subtitle_text is rendered into MP4 frames; standalone subtitle-file export
  deferred to 0005.
- `narration draft`: untimed speakable prose in the script package, sized
  for 60–90 seconds at ~150 words/minute. Must be plain prose with no
  markdown, bullet lists, or parentheticals.
- `target audience`: the intended viewer profile attached authoritatively to
  the 0002 `script package` and preserved unchanged through the 0003
  `narrated timeline draft`.
- `ideation.topic_count`: config key controlling how many concrete topics
  the Concept Ideation Agent produces. Defaults to 1. Values greater than 1
  produce a JSON array output; the pipe adapter feeds only the first topic
  to 0002.
- `script.*` config namespace: configuration keys for the Script Agent,
  including `script.model` (defaults to `deepseek/deepseek-v4-pro`),
  `script.temperature`, and `script.max_duration_s`/`script.min_duration_s`.
- `timeline.*` config namespace: configuration keys for narrated timeline
  drafting, including `timeline.model` (defaults to
  `deepseek/deepseek-v4-pro`) and `timeline.temperature`.
- `timeline segment timing`: `timeline_segments.start_s` and `end_s` are
  numeric seconds from clip start, with fractional precision allowed.
- `ideation model`: `deepseek/deepseek-v4-flash` on OpenRouter — the fast,
  low-cost model used by the Concept Ideation Agent for single-call topic
  generation.
- `script model`: `deepseek/deepseek-v4-pro` on OpenRouter — the
  reasoning-capable model used by the Script Agent for interview-prep
  script generation.
- `local pipeline`: the first product surface, operated through a CLI on the
  creator's machine.
- `asset-driven rendering`: deterministic scene composition from reusable
  motion-graphics assets and templates rather than frame-by-frame generative
  video.
- `cheap polish`: the quality bar for output that is cost-conscious but not
  obvious AI slop.
- `MVP boundary`: one local pipeline from concept or topic input to one
  exported TikTok-ready clip package, with no direct posting and no required
  human editing pass.
- `approved seam`: a lightweight interface, contract, or config boundary kept
  open for clearly deferred work.
- `future publishing adapter`: the approved seam for post-MVP direct upload
  integrations.
- `future feedback ingestion`: the approved seam for post-MVP analytics or
  creator feedback loops.

## Reference Documents

- `AGENTS.md`: Codex orientation and operating contract.
- `docs/PRODUCT.md`: product intent, MVP boundary, constraints, and roadmap.
- `docs/ARCHITECTURE.md`: current intended structure, approved seams, and
  deferred architecture.
- `docs/WORKFLOWS.md`: handoff interface and status contract.
- `docs/AGENT_ROLES.md`: subagent roles, permissions, and routing principles.
- `docs/DOCS_POLICY.md`: documentation destinations and status rules.

## Workflow Boundaries

- Bootstrap owns product replacement of harness-template docs, MVP boundary
  definition, architecture seam derivation, and the first milestone ladder.
- Context maintenance keeps terminology and architecture aligned after settled
  product decisions.
- Requirements should shape one milestone at a time from the MVP ladder rather
  than redesigning the whole roadmap.
- Specs should stay inside the current milestone boundary and reference only
  approved seams from `docs/ARCHITECTURE.md`.
- Dev-loop implementation should optimize for one working local production path
  before expanding platform scope.
- Plan-next should not run until an actual MVP phase ships.

## Environment Notes

- First target machine: local Mac with 24 GB RAM.
- Docker is available.
- The first required product surface is a local CLI.
- Core production must not depend on proprietary editing software.

## Maturity Gaps

- The exact local command set for running the future pipeline is not defined
  yet.
- Render contract and toolchain direction are settled in 0004 spec but not
  yet implemented.
- The narration stack remains unsettled.
- Standalone subtitle-file delivery beyond burn-in remains unsettled
  (deferred to 0005).
- The under-10-minute runtime target is a product goal, not yet a verified
  benchmark.
- The trace retention policy for this repo remains unsettled.

## Open Questions

- Which local-first narration approach best meets the MVP cost and quality bar?
