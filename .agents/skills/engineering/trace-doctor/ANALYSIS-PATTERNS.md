# Analysis Patterns

Use these checks while reviewing traces:

- missing `trace_start`
- missing `trace_end`
- required agent gate missing from routing log
- repeated manual fallback for the same subagent
- unusually high `context_read` count by the main agent
- repeated work on the same spec across many traces
- orphan trace folder with no `trace.jsonl`
- contradictory handoff statuses across related traces

Prefer small, repeated failure patterns over one-off noise.

