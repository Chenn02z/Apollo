# Product Backbone

## Product Intent

This repository is a reusable AI harness for indie developers. The harness
gives a software project durable workflow structure through specs, explicit
handovers, role-specific subagents, and stable repo terminology.

It is not an app runtime and it is not tied to one domain. Your product code,
framework choices, and runtime architecture should live alongside this harness,
not inside its core rules.

## Current Scope

- first-run bootstrap onboarding for a newly forked product repo
- repo operating instructions and workflow skills
- milestone and spec structure
- Codex agent presets for planning, grilling, exploration, implementation,
  verification, review, and documentation
- context docs that prevent terminology drift
- generic templates for specs and milestones
- architecture documentation and incremental phase planning

## Non-Goals For Now

- runtime application code
- deployment scaffolding
- framework-specific project generators
- domain-specific examples or sample products
- team collaboration workflows beyond a single main agent coordinating subagents

## Product Principles

- **Start by interrogating the product**: a fresh fork should not proceed on
  vague direction; bootstrap should force a usable product backbone first.
- **Specs define truth**: implementation traces to accepted requirements.
- **Skills define process**: repeatable workflows live in `.agents/skills/`.
- **Agents execute roles**: model, reasoning, and permission presets live in
  `.codex/agents/`.
- **Main agent owns judgment**: subagents gather, challenge, implement, and
  review; the main agent reconciles and reports.
- **The harness is product-agnostic**: domain assumptions belong in your own
  product docs and specs.
- **Model routing follows risk**: ambiguous or high-impact work gets stronger
  models; narrow exploration can use cheaper ones.
- **Bash is not the orchestration brain**.
- **Prioritize user-visible functionality over infrastructure completeness**:
  MVP means the smallest real end-to-end product loop — reduce breadth, not
  reality. Deliver a concrete, useful experience before filling in every seam.

## Success Criteria

- a fresh fork can be turned into product-specific docs and an initial
  milestone through a structured grilling session
- the MVP boundary drives architectural seams, not the other way around
- vague requests become clear milestones or specs
- specs are grilled before implementation
- implementation follows a consistent explorer -> implementer -> verifier ->
  reviewer loop
- docs, specs, skills, and agent presets remain aligned
- developers can add any product domain without rewriting the harness itself
- shipped milestones feed into phase-level replanning without upfront over-design

## Roadmap Backbone

1. First-run adoption: `$bootstrap` converts the template into a product
   backbone with durable docs, an MVP milestone ladder, and architecture seams.
2. Operating contract: `AGENTS.md`.
3. Workflow foundation: requirements, spec, dev-loop, context, plan-next, and
   test skills.
4. Agent foundation: role/model/permission presets under `.codex/agents/`.
5. Template foundation: milestone, spec, and architecture templates under
   `docs/`.
6. Incremental delivery: `plan-next` proposes the next phase after a phase
   ships, using completed work to reshape future milestones.
7. Domain adoption: each downstream product adds its own accepted milestones,
   specs, code, and docs without changing the shared harness by default.
