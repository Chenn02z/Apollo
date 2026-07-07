---
name: test
description: Runs targeted verification of implemented code against its spec. Use when testing an implemented spec standalone without re-running the full dev-loop, or when dev-loop delegates its verification step.
---

# Test Workflow

Test implemented code against an Accepted or Implemented spec. Delegate
exploration, test execution, and spec-contract review to subagents; the main
agent owns judgment, reporting, and handoff.

## Prerequisites

- The spec under `docs/specs/`.
- `docs/WORKFLOWS.md` (handoff interface and spec status contract only).

## Modes

### Standalone

When invoked directly by the user to test an already-implemented spec:

1. Start `$codex-agent-tracer` before substantial work.
2. Read the spec named by the user.
3. Delegate to `explorer` to discover related tests, fixtures, and the source
   modules the spec touches. Do not read source files yourself.
4. Delegate to `test-runner` to run the discovered tests. Prefer targeted runs
   over sweeping commands until coverage is confirmed.
5. Delegate to `reviewer` to compare the implementation against the spec
   contracts. Flag missing behavior, out-of-scope additions, and contract
   violations.
6. Reconcile test-runner and reviewer findings. If either reports failures,
   batch them into a single summary.
7. Leave a handoff artifact for `$dev-loop` or `$context`.

### Called From Dev-Loop

When the dev-loop has already started a trace and read the spec:

1. Reuse the dev-loop's existing trace folder.
2. Delegate a narrow `explorer` pass for test-discoverable changes only.
3. Delegate to `test-runner` with the test targets.
4. Return verification results; let the dev-loop reconcile reviewer findings
   separately.

## Guardrails

- Do not read source files; delegate to `explorer`.
- Do not run commands; delegate to `test-runner`.
- Do not review diffs yourself; delegate to `reviewer`.
- Batch all failures into one implementer pass.
- Live smoke tests only when credentials exist and the user explicitly opts in.
- Report missing test commands as a repo maturity gap, not as pass.

## Output

Handoff artifact per `docs/WORKFLOWS.md`:

- spec path
- tests discovered and run
- commands and pass or fail results
- reviewer findings
- smallest recommended next step
- trace path

