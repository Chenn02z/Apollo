---
name: improve-codebase-architecture
description: Find workspace architecture-deepening opportunities that reduce AI-spaghetti risk, present them as a visual HTML report, then route the chosen candidate through grill-with-docs. Use when reviewing workspace structure, workflow seams, module boundaries, or maintainability before implementation work expands.
---

# Improve Codebase Architecture

Surface architectural friction in the workspace and propose deepening
opportunities: refactors that move scattered behavior behind a small, useful
interface. The aim is to prevent AI-generated spaghetti by improving locality,
leverage, and testability before implementation work expands.

This skill is for architecture review, not immediate implementation. It should
produce review artifacts the developer can inspect and then pressure-test with
`grill-with-docs` before spec or code work expands.

## Vocabulary

Use architecture terms in [HTML-REPORT.md](HTML-REPORT.md) and workspace
language from `docs/CONTEXT.md`.

## Process

### 1. Read context

Read `docs/CONTEXT.md` for terminology. Read only the docs, specs, and
milestones relevant to the architecture review target.

### 2. Explore code

Inspect docs, skills, code, and tests directly. Favor current Accepted,
Implemented, or Draft specs and milestones over assumptions in `README.md`.

Look for friction:

- one workflow concept requires bouncing across many files
- a module is shallow and callers know too much about its implementation
- a behavior spreads across docs, skills, code, and tests with no stable interface
- tests reach through internals instead of exercising a meaningful interface
- handoff rules or workflow boundaries are duplicated or bypassable

### 3. Present candidates

Write a self-contained HTML report to `docs/techdebt/architecture-review-<timestamp>.html`.
Use [HTML-REPORT.md](HTML-REPORT.md) for structure. Create durable follow-up
tickets under `docs/techdebt/` using [TECHDEBT-TICKET.md](TECHDEBT-TICKET.md).
Default new tickets to `proposed`.

Do not implement or finalize a new interface during the report. After the file
is written, ask which candidate should be grilled first.

### 4. Grilling loop

Once the user picks a candidate, use `grill-with-docs` to pressure-test it
against product intent, milestone docs, code, and terminology.

If the candidate changes product requirements or executable behavior, route to
`requirements` or `spec` before implementation. If it can proceed from an
Accepted spec, route implementation to `dev-loop` after the design settles.
