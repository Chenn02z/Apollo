# Apollo

Apollo is a Codex-native staged workflow for turning a technical topic into an
interview-oriented carousel. Its shipped first stage creates a validated
seven-slide content artifact; rendering is planned separately.

## MVP

Invoke the `apollo-generate` Codex skill (explicitly, or through an equivalent
carousel-generation request) with a topic such as `ACID properties in databases`.

The shipped `apollo-generate` stage produces a run directory containing:

- `request.json`
- `carousel-content.json`

Apollo is local-only and Codex-native. The shipped custom-agent content stage
produces structured copy; the Accepted renderer milestone will add constrained
HTML, seven PNG slides, and a manifest. Apollo does not run a standalone LLM API
client or require a runtime API key. Deterministic render validation is planned
for milestone 0003.

`docs/reference/html/index.html` is source material for the `database` theme
pack; it is not raw runtime output.

## Scope

Apollo is for creators making concise technical interview-preparation
carousels. The first proof set is ACID properties, indexes, caching, REST vs
GraphQL, and embeddings.

Source-backed research, citations, visual-review repair loops, an AI theme,
theme taxonomy or plugins, generated imagery, publishing, scheduling,
analytics, web UI, and authentication are post-MVP.

## Development

Milestone 0001 is Verified and 0002 is Accepted. Create its implementation
contract with `$spec`, then implement through `$dev-loop`; shape Draft
milestone 0003 through `$requirements` first.

Renderer development uses Node 22 LTS. Run `npm ci`, then once run `npx
playwright install chromium`. The renderer's targeted checks are `npm run
test:renderer`.
