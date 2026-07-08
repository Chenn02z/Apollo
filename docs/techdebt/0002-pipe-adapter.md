# Pipe Adapter Boundary

## Status

proposed

## Problem

`docs/CONTEXT.md` and `docs/ARCHITECTURE.md` describe a "pipe adapter" that
connects 0001 → 0002: when `topic_count > 1`, the adapter selects the first
(top-ranked) topic from the ideation array and feeds a single `{topic, angle}`
object into script generation. Today this adapter is documentation only:

- The actual bridging happens implicitly through `apollo script -` reading
  stdin (shell-level pipe).
- There is no `apollo pipe` or `apollo run` command that composes the two
  stages programmatically.
- The adapter logic (select first topic from array, validate, feed into
  script) is not testable as a unit — it only exists as CLI argument routing
  in `cli.py`.
- Future multi‑stage composition (ideation → script → timeline assembly) will
  repeat the same ad‑hoc shell piping pattern.

## Proposed Change

Add an explicit pipe boundary that makes the documented contract executable:

Option A: Add `apollo run <concept>` that chains ideation → script in one
command. Internally calls `ideate()` then `generate_script()` with the
top‑ranked result.

Option B: Add `apollo pipe` as an explicit subcommand that accepts ideation
output (JSON on stdin or as argument) and feeds it to `generate_script()`.

Option A is simpler for the MVP creator experience; Option B preserves the
stage‑decoupled philosophy.

## Acceptance Criteria

- A single CLI invocation can go from concept to script package without
  manual shell piping.
- The pipe adapter logic (select first topic, pass as `{topic, angle}`) is
  testable in isolation.
- Existing standalone `apollo ideate` and `apollo script` commands continue
  to work unchanged.
- The pipe adapter respects the contract: when `topic_count=1`, the single
  dict passes through; when `topic_count > 1`, the first array element is
  selected.

## Implementation Notes

- Place the pipe adapter in `src/apollo/pipe.py` or as an additional
  subcommand handler in `cli.py`.
- The adapter should call `ideate()` and `generate_script()` as functions
  (not subprocesses) to keep it fast and testable.
- If the user picks Option A, consider adding a `--count` flag to `apollo
  run` for topic count passthrough.
</EOF
echo "Created 0002-pipe-adapter.md"