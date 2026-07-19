# Architecture

Documents the current code structure, approved seams, and explicitly deferred
architecture. Seams are lightweight boundaries that exist now so future
features can be added without rewrites — they are never speculative blueprints
or unused frameworks.

Update through `$context` when architecture decisions settle. Bootstrap seeds
this from the MVP boundary; `plan-next` and `$requirements` consult it when
shaping the next milestone.

## Current Structure

Describe the code layout and component boundaries as they exist today. Keep
this concise — a component map, not a class diagram.

## Approved Seams

Boundaries the codebase deliberately exposes for future extension. Each seam
should be lightweight and live in the repo (an interface, a plugin hook, a
config entry point). List only what exists in code, not what is planned.

For each seam:
- **What**: the boundary (interface, hook, config key)
- **Why**: what future feature it unblocks
- **Current path**: what's wired today

## Deferred Architecture

Features or structural changes that are intentionally NOT built yet. Each
entry names what is deferred, which milestone or phase it belongs to, and
what seam (if any) was left open for it.

---

*Template — replace during `$bootstrap`.*
