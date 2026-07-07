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
- `topic-only intake`: the MVP input contract where `topic` is the only
  required production input.
- `seed-link grounding`: optional future input of supporting source links or
  materials to steer research and scripting.
- `local pipeline`: the first product surface, operated through a CLI on the
  creator's machine.
- `asset-driven rendering`: deterministic scene composition from reusable
  motion-graphics assets and templates rather than frame-by-frame generative
  video.
- `cheap polish`: the quality bar for output that is cost-conscious but not
  obvious AI slop.
- `MVP boundary`: one local pipeline from topic input to one exported
  TikTok-ready clip package, with no direct posting and no required human
  editing pass.
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
- The concrete narration stack, subtitle toolchain, and render toolchain are
  intentionally unsettled at bootstrap time.
- The under-10-minute runtime target is a product goal, not yet a verified
  benchmark.
- The trace retention policy for this repo remains unsettled.

## Open Questions

- Which local-first narration approach best meets the MVP cost and quality bar?
- Which render stack best supports deterministic motion-graphics output on the
  initial machine without adding proprietary dependencies?
