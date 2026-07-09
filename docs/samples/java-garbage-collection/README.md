# Seed: Java Garbage Collection

- **Command chain**: `apollo ideate "Java Garbage Collection" | apollo script - | apollo timeline -`
  - The chained pipeline failed on the timeline step with `NoneType` serialization error.
  - The timeline was regenerated successfully by piping the saved `02-script.json` directly into `apollo timeline -`.
- **Generated files**:
  - `01-ideation.json` — ideation output
  - `02-script.json` — script package output
  - `03-timeline.json` — narrated timeline output (from saved script)
- **Status**: ✅ All three stages completed (timeline re-run from saved `02-script.json`). Known issue: chained pipe produced `NoneType` on the timeline stage.
