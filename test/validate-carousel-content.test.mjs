import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { validateRun } from "../scripts/validate-carousel-content.mjs";
import { createRun } from "../scripts/create-carousel-run.mjs";

const intermediate = ["concept", "example", "deep-dive", "interview"];
const variants = ["hero", "fact", "list", "quote", "comparison", "levels", "list"];
function slide(number, role, variant = variants[(number - 1) % variants.length]) {
  const common = { number, role, variant, title: `Slide ${number}`, why: "This explains a concrete database decision.", glossary: [{ term: "Transaction", definition: "A unit of database work." }] };
  if (variant === "hero") return { ...common, prompt: "Start with the failure mode." };
  if (variant === "fact") return { ...common, factValue: "1 unit", factLabel: "One visible database result." };
  if (variant === "list") return { ...common, items: [{ label: "A", detail: "First concrete mechanism." }, { label: "B", detail: "Second concrete mechanism." }] };
  if (variant === "quote") return { ...common, quote: "A safe system never exposes a half-finished result.", attribution: "Database practice" };
  if (variant === "comparison") return { ...common, comparison: { left: { label: "Lower", summary: "More concurrency.", items: ["Fewer checks", "More risk"] }, right: { label: "Higher", summary: "More protection.", items: ["More checks", "Less risk"] } } };
  return { ...common, levels: [{ label: "Basic", value: 25, description: "Minimal protection." }, { label: "Strong", value: 75, description: "More coordination." }] };
}
function fixture(count = 7) {
  const root = mkdtempSync(join(tmpdir(), "apollo-")), run = join(root, "runs", "run-1"), request = { topic: "ACID", runId: "run-1", createdAt: "2026-07-16T00:00:00.000Z", model: "gpt-5.6-terra", effort: "medium" };
  const roles = ["hook", "overview", ...Array.from({ length: count - 3 }, (_, i) => intermediate[i % intermediate.length]), "takeaway"];
  return { run, request, content: { topic: "ACID", slides: roles.map((role, i) => slide(i + 1, role)) } };
}
function write(value) { mkdirSync(value.run, { recursive: true }); writeFileSync(join(value.run, "request.json"), JSON.stringify(value.request)); writeFileSync(join(value.run, "carousel-content.json"), JSON.stringify(value.content)); }

test("accepts seven and ten adaptive structured slides", () => { for (const count of [7, 10]) { const value = fixture(count); write(value); assert.equal(validateRun(value.run).slides.length, count); } });
test("rejects count, roles, closed schemas, markup, and Unicode limit violations", () => {
  const changes = [value => value.content.slides.pop(), value => value.content.slides.push(value.content.slides.at(-1)), value => { value.content.slides[1].role = "concept"; }, value => { value.content.extra = true; }, value => { value.content.slides[0].title = "😀".repeat(81); }, value => { value.content.slides[0].prompt = "<b>x</b>"; }];
  for (const change of changes) { const value = fixture(); change(value); write(value); assert.throws(() => validateRun(value.run)); assert.equal(existsSync(join(value.run, "carousel-content.json")), false); assert.equal(existsSync(join(value.run, "request.json")), true); }
});
test("reports unsupported intermediate roles and removes invalid content", () => {
  const value = fixture(); value.content.slides[2].role = "decision"; write(value);
  assert.throws(() => validateRun(value.run), /Invalid role on slide 3: received "decision"; permitted roles: concept, example, deep-dive, interview/);
  assert.equal(existsSync(join(value.run, "carousel-content.json")), false);
});
test("removes an invalid candidate without deleting valid canonical content", () => {
  const value = fixture(); write(value); writeFileSync(join(value.run, "carousel-content.candidate.json"), "not json");
  assert.throws(() => validateRun(value.run, { file: "carousel-content.candidate.json" }));
  assert.equal(existsSync(join(value.run, "carousel-content.candidate.json")), false);
  assert.equal(validateRun(value.run).topic, "ACID");
});
test("rejects unsafe content filenames without deleting canonical content", () => {
  const value = fixture(); write(value);
  assert.throws(() => validateRun(value.run, { file: "request.json" }), /Invalid content filename/);
  assert.equal(existsSync(join(value.run, "carousel-content.json")), true);
});
test("creates a request after normalizing the topic", () => {
  const root = mkdtempSync(join(tmpdir(), "apollo-")), run = createRun("  ACID  ", { root, runId: "run-1", createdAt: "2026-07-16T00:00:00.000Z" });
  assert.equal(existsSync(join(run, "request.json")), true); assert.throws(() => createRun(" ", { root, runId: "run-2" }));
});
