import { lstatSync, readFileSync, rmSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const reviewFiles = new Set(["carousel-review-1.json", "carousel-review-2.json", "carousel-review-3.json"]);
const decisions = new Set(["approve", "approve_with_warnings", "reject"]);
const scoreKeys = ["technicalCorrectness", "interviewRelevance", "depth", "concreteness", "tradeoffs", "misconceptions", "progression", "interviewTransfer", "copyQuality", "visualFitness"];
const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
const exactly = (value, keys) => object(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const text = value => typeof value === "string";
const slides = value => Array.isArray(value) && value.every(number => Number.isInteger(number) && number > 0);
const fail = message => { throw new Error(message); };
const readJson = path => { try { return JSON.parse(readFileSync(path, "utf8")); } catch { fail(`Unreadable or invalid JSON: ${basename(path)}`); } };

function validateReview(review) {
  if (!exactly(review, ["version", "decision", "summary", "scores", "hardFailures", "findings", "weakestSlides", "strengths", "priorityChanges"]) || review.version !== "1" || !decisions.has(review.decision) || !text(review.summary)) fail("Invalid review");
  if (!exactly(review.scores, scoreKeys) || !scoreKeys.every(key => Number.isInteger(review.scores[key]) && review.scores[key] >= 1 && review.scores[key] <= 5)) fail("Invalid review scores");
  if (!Array.isArray(review.hardFailures) || !review.hardFailures.every(value => exactly(value, ["code", "slides", "evidence", "reason"]) && text(value.code) && slides(value.slides) && text(value.evidence) && text(value.reason))) fail("Invalid hard failures");
  if (!Array.isArray(review.findings) || !review.findings.every(value => exactly(value, ["severity", "code", "slides", "evidence", "analysis", "recommendedChange"]) && ["error", "warning", "note"].includes(value.severity) && text(value.code) && slides(value.slides) && text(value.evidence) && text(value.analysis) && text(value.recommendedChange))) fail("Invalid findings");
  if (!slides(review.weakestSlides) || !Array.isArray(review.strengths) || !review.strengths.every(value => exactly(value, ["slides", "reason"]) && slides(value.slides) && text(value.reason)) || !Array.isArray(review.priorityChanges) || !review.priorityChanges.every(text)) fail("Invalid review details");
  const scores = review.scores, rejects = review.hardFailures.length || scores.technicalCorrectness < 4 || ["interviewRelevance", "depth", "concreteness", "tradeoffs", "interviewTransfer"].some(key => scores[key] < 3);
  if (review.decision !== "reject" && rejects) fail("Review decision contradicts hard failures or scores");
  if (review.decision === "approve" && scoreKeys.some(key => scores[key] < 4)) fail("Approve decision requires scores of at least 4");
  return review;
}

export function validateReviewRun(runDirectory, { file } = {}) {
  if (!reviewFiles.has(file)) fail("Invalid review filename");
  const runPath = resolve(runDirectory), runId = basename(runPath), reviewPath = join(runPath, file); let safe = false;
  try { if (basename(dirname(runPath)) !== "runs" || !runId || lstatSync(dirname(runPath)).isSymbolicLink() || lstatSync(runPath).isSymbolicLink()) fail("Invalid run path"); safe = true; if (lstatSync(reviewPath).isSymbolicLink()) fail("Symlinked artifact"); return validateReview(readJson(reviewPath)); }
  catch (error) { if (safe) try { if (lstatSync(reviewPath).isFile() && !lstatSync(reviewPath).isSymbolicLink()) rmSync(reviewPath); } catch { /* preserve missing and unsafe artifacts */ } throw error; }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) try {
  const [, , runDirectory, flag, file] = process.argv;
  if (flag !== "--file" || !file || process.argv.length !== 5) fail("Usage: validate-carousel-review.mjs <run-dir> --file <filename>");
  validateReviewRun(runDirectory ?? "", { file });
} catch (error) { console.error(`Review validation failed: ${error.message}`); process.exitCode = 1; }
