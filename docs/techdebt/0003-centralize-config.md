# Centralize Configuration

## Status

proposed

## Problem

Configuration values are read ad‑hoc via `os.environ.get()` scattered across
five source locations:

- `src/concept_ideation/ideate.py` — `IDEATION_TOPIC_COUNT`
- `src/concept_ideation/provider.py` — `IDEATION_MODEL`, `OPENROUTER_API_KEY`
- `src/script_agent/script.py` — min/max duration constants (hardcoded)
- `src/script_agent/provider.py` — `SCRIPT_MODEL`, `SCRIPT_TEMPERATURE`,
  `SCRIPT_MAX_DURATION_S`, `SCRIPT_MIN_DURATION_S`, `OPENROUTER_API_KEY`
- Each `provider.py` has private `_model()`, `_temperature()`, etc. helpers
  that duplicate the same env‑var access pattern.

There is no single place to discover all config keys, no validation (e.g.
temperature must be in [0,2]), no way to dump effective config for debugging,
and no guard against typos in env var names. As milestones 0003–0005 add
narration, render, and export config, the scatter will grow.

## Proposed Change

Create `src/apollo/config.py` with a frozen/immutable config object loaded
once at startup. It reads env vars, applies defaults, validates ranges, and
exposes typed accessors:

```python
config.ideation_model          # defaults to "deepseek/deepseek-v4-flash"
config.ideation_topic_count    # defaults to 1
config.script_model            # defaults to "deepseek/deepseek-v4-pro"
config.script_temperature      # defaults to 0.3, validated [0.0, 2.0]
config.script_min_duration_s   # defaults to 60
config.script_max_duration_s   # defaults to 90
config.openrouter_api_key      # required, raises on missing
```

Optionally add `apollo config` subcommand or `--show-config` flag to print
effective config for debugging.

## Acceptance Criteria

- One `src/apollo/config.py` module is the single source of truth for all
  config values.
- All `os.environ.get()` calls for known config keys are removed from
  concept_ideation and script_agent modules; they import from config instead.
- Config validates temperature range and non‑empty API key at load time.
- `apollo --show-config` (or `apollo config`) prints all config keys with
  their resolved values and source (env var or default).
- All existing unit tests pass. Tests that mock `os.environ` for config
  values may need to mock the config object instead.

## Implementation Notes

- Prefer a frozen dataclass or `types.MappingProxyType` over a module‑level
  dict to prevent accidental mutation.
- Load config once at import time; do not re‑read env vars on every call.
- The config object should be importable without side effects (no API calls).
- Do not add a config file parser — env vars are sufficient for the MVP CLI
  surface.
</EOF
echo "Created 0003-centralize-config.md"