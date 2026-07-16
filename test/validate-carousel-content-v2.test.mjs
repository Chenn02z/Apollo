import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { validateRunV2 } from "../scripts/validate-carousel-content-v2.mjs";
import { createRunV2 } from "../scripts/create-carousel-run-v2.mjs";

const intermediate = ["concept", "example", "deep-dive", "interview"];
function fixture(count = 6) {
  const root = mkdtempSync(join(tmpdir(), "apollo-v2-")), run = join(root, "runs", "run-1"), request = { contractVersion: "2", topic: "ACID", runId: "run-1", createdAt: "2026-07-16T00:00:00.000Z", model: "gpt-5.6-terra", effort: "medium" };
  const roles = ["hook", "overview", ...Array.from({ length: count - 3 }, (_, i) => intermediate[i % intermediate.length]), "takeaway"];
  return { run, request, content: { version: "2", topic: "ACID", slides: roles.map((role, i) => ({ number: i + 1, role, title: `Slide ${i + 1}`, body: "Plain prose.", items: [] })) } };
}
function write(value) { mkdirSync(value.run, { recursive: true }); writeFileSync(join(value.run, "request-v2.json"), JSON.stringify(value.request)); writeFileSync(join(value.run, "carousel-content-v2.json"), JSON.stringify(value.content)); }

test("accepts six and ten adaptive slides", () => { for (const count of [6, 10]) { const value = fixture(count); write(value); assert.equal(validateRunV2(value.run).slides.length, count); } });
test("rejects count, roles, closed schemas, markup, and Unicode limit violations", () => {
  const changes = [value => value.content.slides.pop(), value => value.content.slides.push(value.content.slides.at(-1)), value => { value.content.slides[1].role = "concept"; }, value => { value.content.extra = true; }, value => { value.content.slides[0].title = "😀".repeat(81); }, value => { value.content.slides[0].body = "<b>x</b>"; }];
  for (const change of changes) { const value = fixture(); change(value); write(value); assert.throws(() => validateRunV2(value.run)); assert.equal(existsSync(join(value.run, "carousel-content-v2.json")), false); assert.equal(existsSync(join(value.run, "request-v2.json")), true); }
});
test("reports unsupported intermediate roles and removes invalid content", () => {
  const value = fixture(); value.content.slides[2].role = "decision"; write(value);
  assert.throws(() => validateRunV2(value.run), /Invalid role on slide 3: received "decision"; permitted roles: concept, example, deep-dive, interview/);
  assert.equal(existsSync(join(value.run, "carousel-content-v2.json")), false);
});
test("creates only a v2 request after normalizing the topic", () => {
  const root = mkdtempSync(join(tmpdir(), "apollo-v2-")), run = createRunV2("  ACID  ", { root, runId: "run-1", createdAt: "2026-07-16T00:00:00.000Z" });
  assert.equal(existsSync(join(run, "request-v2.json")), true); assert.equal(existsSync(join(run, "request.json")), false); assert.throws(() => createRunV2(" ", { root, runId: "run-2" }));
});
