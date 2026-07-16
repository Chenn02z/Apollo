import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { validateReviewRun } from "../scripts/validate-carousel-review.mjs";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "apollo-")), run = join(root, "runs", "run-1"); mkdirSync(run, { recursive: true });
  return { run, review: { version: "1", decision: "approve", summary: "Ready.", scores: Object.fromEntries(["technicalCorrectness", "interviewRelevance", "depth", "concreteness", "tradeoffs", "misconceptions", "progression", "interviewTransfer", "copyQuality", "visualFitness"].map(key => [key, 4])), hardFailures: [], findings: [], weakestSlides: [], strengths: [{ slides: [1], reason: "Specific." }], priorityChanges: [] } };
}
test("accepts a valid numbered review", () => { const value = fixture(); writeFileSync(join(value.run, "carousel-review-1.json"), JSON.stringify(value.review)); assert.equal(validateReviewRun(value.run, { file: "carousel-review-1.json" }).decision, "approve"); });
test("removes malformed named reviews", () => { const value = fixture(); value.review.decision = "maybe"; writeFileSync(join(value.run, "carousel-review-2.json"), JSON.stringify(value.review)); assert.throws(() => validateReviewRun(value.run, { file: "carousel-review-2.json" })); assert.equal(existsSync(join(value.run, "carousel-review-2.json")), false); });
test("removes decisions contradicted by hard-failure score thresholds", () => { const value = fixture(); value.review.scores.technicalCorrectness = 3; writeFileSync(join(value.run, "carousel-review-2.json"), JSON.stringify(value.review)); assert.throws(() => validateReviewRun(value.run, { file: "carousel-review-2.json" }), /contradicts/); assert.equal(existsSync(join(value.run, "carousel-review-2.json")), false); });
test("rejects unsafe review filenames", () => { const value = fixture(); writeFileSync(join(value.run, "carousel-review-1.json"), JSON.stringify(value.review)); assert.throws(() => validateReviewRun(value.run, { file: "carousel-review.json" }), /Invalid review filename/); assert.equal(existsSync(join(value.run, "carousel-review-1.json")), true); });
