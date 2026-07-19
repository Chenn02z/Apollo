# AI Harness

> A specs-driven agent workspace template for indie developers.

AI Harness is a reusable starter repo for building software with a strict
multi-agent development loop and incremental MVP delivery. It gives you:

- a repo operating contract in `AGENTS.md`
- reusable workflow skills under `.agents/skills/`
- reusable agent presets under `.codex/agents/`
- docs and templates for milestones, specs, architecture, handoffs, and context alignment
- a first-run bootstrap path for turning the template into a real product repo
- phase-based replanning to ship the next increment based on what actually shipped

This repo is the harness, not your product runtime. Bring your own app, domain,
and codebase. The harness exists to keep planning, implementation, review, and
documentation aligned as your project grows.

## Who It Is For

Solo and indie developers who want:

- explicit milestone and spec gates
- incremental, phase-based delivery (ship something real, then replan)
- repeatable multi-agent workflows
- stable repo terminology
- architecture seams that keep future work clean without speculative overbuild
- traceable handoffs between planning, implementation, testing, and docs

## Workflow Backbone

1. Run `$bootstrap` immediately after forking to determine the MVP boundary,
   derive architecture seams, build an MVP milestone ladder, and replace this
   harness-template README with a project-specific public overview.
2. Shape the first milestone with `$requirements`.
3. Accept a milestone in `docs/milestones/` when scope is settled.
4. Draft an implementation spec with `$spec`, referencing architecture seams.
5. Pressure-test the spec before implementation.
6. Implement through `$dev-loop`, which respects architecture seams and includes
   verification by delegating to `$test`.
7. Invoke `$test` directly for standalone or ad hoc verification when you do
   not need the full dev loop.
8. When a phase ships (all its milestones are complete), trigger `plan-next`
   to propose the next phase's Draft milestones based on what shipped.
9. Realign docs, skills, `user-journeys.html`, and agent rules through
   `$context` when decisions settle (auto-triggered by `AGENTS.md`).

## Repository Layout

```text
.
├── AGENTS.md
├── user-journeys.html
├── .agents/skills/
├── .codex/agents/
└── docs/
    ├── adr/
    ├── ARCHITECTURE.md
    ├── PRODUCT.md
    ├── CONTEXT.md
    ├── WORKFLOWS.md
    ├── AGENT_ROLES.md
    ├── DOCS_POLICY.md
    ├── milestones/
    ├── specs/
    └── techdebt/
```

## How To Use

1. Start from this repo as a template.
2. Run `$bootstrap` as the first real task after the fork.
3. Answer the grilling session until the product backbone is coherent, then
   explicitly confirm the concrete bootstrap summary: MVP boundary, ordered
   MVP milestone ladder, and explicit post-MVP cutoff.
4. Let bootstrap tailor `README.md` into a project-specific public overview
   while keeping deeper product detail in `docs/PRODUCT.md`.
5. Shape and implement milestones one phase at a time. Run `plan-next` after
   each phase to propose the next increment.
6. Use `user-journeys.html` at the repo root as the visual map of what the
   harness supports and what the intended developer paths are.
7. Keep the workflow docs and agent presets strict unless you intentionally
   change the harness rules.
8. Add your application code beside this harness structure.

## Non-Goals

- application runtime code
- framework-specific scaffolding
- domain-specific examples
- historical traces, accepted milestones, or completed specs from another repo
