# Shared OpenRouter Provider

## Status

proposed

## Problem

`src/concept_ideation/provider.py` and `src/script_agent/provider.py` each
contain ~60 lines of near-identical OpenRouter calling boilerplate:
`httpx.post`, API-key check, 404 model-not-found detection, error wrapping into
`ProviderError`. The two providers differ only in model default, temperature,
timeout, and prompt assembly. Every future pipeline stage (narration, render,
etc.) will duplicate this again, risking drift in retry policy, error taxonomy,
and timeout values.

## Proposed Change

Extract a single `src/apollo/providers/openrouter.py` module with a
`chat_completion(model, messages, **kwargs) -> str` function (or a small
`OpenRouterClient` class). Each agent's provider becomes a thin
prompt-assembly + parse layer that delegates the HTTP round-trip to the shared
module.

Shared responsibilities:
- API-key resolution (`OPENROUTER_API_KEY`)
- HTTP request construction and error handling
- Model-not-found (404) detection
- Timeout configuration
- Retry policy (single retry on transient errors)

Agent-specific responsibilities stay local:
- Model default (`IDEATION_MODEL`, `SCRIPT_MODEL`)
- Prompt assembly
- Response parsing and validation

## Acceptance Criteria

- One `src/apollo/providers/` module contains the OpenRouter HTTP logic.
- Both `concept_ideation/provider.py` and `script_agent/provider.py` delegate
  HTTP calls to the shared module.
- All existing unit tests pass without behavior change.
- A new unit test verifies the shared module's error handling (404, auth
  failure, unparseable response).
- No changes to the input/output contracts of `generate_topics()` or
  `call_llm()`.

## Implementation Notes

- The shared module should expose a single function, not a class, unless the
  class adds value (e.g. session reuse).
- Keep `ProviderError` per-agent (they have different meanings) rather than
  a single shared error class — or use a base `ProviderError` with subclasses.
- Existing tests that mock `httpx.post` at the provider level may need to
  shift their mock target to the shared module.
</EOF
echo "Created 0001-shared-provider.md"