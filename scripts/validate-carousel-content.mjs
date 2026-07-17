import { lstatSync, readFileSync, rmSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateText } from "./validate-text.mjs";

export const CAPACITY_LIMITS = Object.freeze({ topic:48, title:56, why:180, label:80, detail:240, statement:360, code:600, glossaryTerm:32, glossaryDefinition:96 });
const codePoints = value => Array.from(value).length;
const unbreakable = value => /\S{33,}/u.test(value);
const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
const exactly = (value, keys) => object(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const fail = message => { throw new Error(message); };
const readJson = path => { try { return JSON.parse(readFileSync(path, "utf8")); } catch { fail(`Unreadable or invalid JSON: ${basename(path)}`); } };
const text = (value, limit, field) => { validateText(value, limit); if (value !== value.trim()) fail(`${field} must be trimmed`); if (unbreakable(value)) fail(`${field} exceeds shell token capacity (32 code points)`); };

function validateRequest(request, runId) {
  if (!exactly(request, ["topic", "runId", "createdAt", "model", "effort"]) || typeof request.topic !== "string" || request.runId !== runId || request.model !== "gpt-5.6-terra" || request.effort !== "medium" || typeof request.createdAt !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(request.createdAt) || new Date(request.createdAt).toISOString() !== request.createdAt) fail("Invalid request");
}
function validateGlossary(entries, slide) {
  if (!Array.isArray(entries) || entries.length < 1 || entries.length > 2) fail(`Slide ${slide} needs 1–2 glossary entries`);
  entries.forEach((entry, index) => { if (!exactly(entry, ["term", "definition"])) fail(`Invalid glossary entry on slide ${slide}`); text(entry.term, CAPACITY_LIMITS.glossaryTerm, `Slide ${slide} glossary[${index}].term`); text(entry.definition, CAPACITY_LIMITS.glossaryDefinition, `Slide ${slide} glossary[${index}].definition`); });
}
function validatePairs(values, min, max, slide, field) {
  if (!Array.isArray(values) || values.length < min || values.length > max) fail(`Slide ${slide} ${field} needs ${min}–${max} items`);
  values.forEach((value, index) => {
    if (!exactly(value, ["label", "detail"])) fail(`Invalid ${field} item on slide ${slide}`);
    text(value.label, CAPACITY_LIMITS.label, `Slide ${slide} ${field}[${index}].label`);
    text(value.detail, CAPACITY_LIMITS.detail, `Slide ${slide} ${field}[${index}].detail`);
  });
}
function validateSemanticContent(content, slide) {
  if (!object(content) || typeof content.type !== "string") fail(`Invalid content on slide ${slide}`);
  if (content.type === "statement") {
    if (!exactly(content, ["type", "text"])) fail(`Invalid statement content on slide ${slide}`);
    text(content.text, CAPACITY_LIMITS.statement, `Slide ${slide} content.text`);
  } else if (["collection", "checklist"].includes(content.type)) {
    if (!exactly(content, ["type", "items"])) fail(`Invalid ${content.type} content on slide ${slide}`);
    validatePairs(content.items, 2, 6, slide, "content.items");
  } else if (content.type === "sequence") {
    if (!exactly(content, ["type", "steps"])) fail(`Invalid sequence content on slide ${slide}`);
    validatePairs(content.steps, 2, 6, slide, "content.steps");
  } else if (content.type === "comparison") {
    if (!exactly(content, ["type", "sides"]) || !Array.isArray(content.sides) || content.sides.length !== 2) fail(`Invalid comparison content on slide ${slide}`);
    content.sides.forEach((side, sideIndex) => {
      if (!exactly(side, ["label", "items"]) || !Array.isArray(side.items) || side.items.length < 1 || side.items.length > 4) fail(`Invalid comparison side on slide ${slide}`);
      text(side.label, CAPACITY_LIMITS.label, `Slide ${slide} content.sides[${sideIndex}].label`);
      side.items.forEach((item, itemIndex) => text(item, CAPACITY_LIMITS.detail, `Slide ${slide} content.sides[${sideIndex}].items[${itemIndex}]`));
    });
  } else if (content.type === "example") {
    if (!exactly(content, ["type", "setup", "code", "explanation"])) fail(`Invalid example content on slide ${slide}`);
    text(content.setup, CAPACITY_LIMITS.detail, `Slide ${slide} content.setup`);
    text(content.code, CAPACITY_LIMITS.code, `Slide ${slide} content.code`);
    text(content.explanation, CAPACITY_LIMITS.detail, `Slide ${slide} content.explanation`);
  } else fail(`Invalid content type on slide ${slide}: ${content.type}`);
}
function validateSlide(slide, index, slides) {
  const required = ["number", "role", "title", "why", "glossary", "content"];
  if (!exactly(slide, required) || slide.number !== index + 1) fail(`Invalid slide ${index + 1}`);
  const permittedRoles = index === 0 ? ["hook"] : index === 1 ? ["overview"] : index === slides.length - 1 ? ["takeaway"] : ["concept", "example", "deep-dive", "interview"];
  if (!permittedRoles.includes(slide.role)) fail(`Invalid role on slide ${index + 1}: received ${JSON.stringify(slide.role)}; permitted roles: ${permittedRoles.join(", ")}`);
  text(slide.role, 32, `Slide ${index + 1} role`); text(slide.title, CAPACITY_LIMITS.title, `Slide ${index + 1} title`); text(slide.why, CAPACITY_LIMITS.why, `Slide ${index + 1} why`); validateGlossary(slide.glossary, index + 1);
  validateSemanticContent(slide.content, index + 1);
}
function validateContent(content, topic) {
  text(topic, CAPACITY_LIMITS.topic, "Topic");
  if (!exactly(content, ["topic", "slides"]) || content.topic !== topic || !Array.isArray(content.slides) || content.slides.length < 7 || content.slides.length > 10) fail(`Invalid slide count: ${content.slides?.length ?? "unknown"}; expected 7–10`);
  content.slides.forEach(validateSlide);
}
const contentFiles = new Set(["carousel-content.json", "carousel-content.candidate.json"]);
export function validateRun(runDirectory, { file = "carousel-content.json" } = {}) {
  if (!contentFiles.has(file)) fail("Invalid content filename");
  const runPath = resolve(runDirectory), runId = basename(runPath), contentPath = join(runPath, file); let safe = false;
  try { if (basename(dirname(runPath)) !== "runs" || !runId || lstatSync(dirname(runPath)).isSymbolicLink() || lstatSync(runPath).isSymbolicLink()) fail("Invalid run path"); safe = true; const requestPath = join(runPath, "request.json"); if (lstatSync(requestPath).isSymbolicLink() || lstatSync(contentPath).isSymbolicLink()) fail("Symlinked artifact"); const request = readJson(requestPath); validateRequest(request, runId); const content = readJson(contentPath); validateContent(content, request.topic); return content; }
  catch (error) { if (safe) try { if (lstatSync(contentPath).isFile() && !lstatSync(contentPath).isSymbolicLink()) rmSync(contentPath); } catch { /* preserve missing and unsafe artifacts */ } throw error; }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) try {
  const [, , runDirectory, flag, file] = process.argv;
  if (flag && (flag !== "--file" || !file || process.argv.length !== 5)) fail("Usage: validate-carousel-content.mjs <run-dir> [--file <filename>]");
  validateRun(runDirectory ?? "", { file: file ?? "carousel-content.json" });
} catch (error) { console.error(`Validation failed: ${error.message}`); process.exitCode = 1; }
