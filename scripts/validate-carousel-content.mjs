import { lstatSync, readFileSync, rmSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateText } from "./validate-text.mjs";

export const CAPACITY_LIMITS = Object.freeze({ topic:48, title:56, why:180, prompt:110, factValue:24, factLabel:96, itemLabel:32, itemDetail:112, quote:220, attribution:72, comparisonLabel:36, comparisonSummary:96, comparisonItem:64, levelLabel:36, levelDescription:96, glossaryTerm:32, glossaryDefinition:96 });
const codePoints = value => Array.from(value).length;
const unbreakable = value => /\S{33,}/u.test(value);
const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
const exactly = (value, keys) => object(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const fail = message => { throw new Error(message); };
const readJson = path => { try { return JSON.parse(readFileSync(path, "utf8")); } catch { fail(`Unreadable or invalid JSON: ${basename(path)}`); } };
const text = (value, limit, field) => { validateText(value, limit); if (unbreakable(value)) fail(`${field} exceeds shell token capacity (32 code points)`); };
const textList = (values, min, max, limit, field) => { if (!Array.isArray(values) || values.length < min || values.length > max) fail(`Invalid ${field} count`); values.forEach((value, index) => text(value, limit, `${field}[${index}]`)); };

function validateRequest(request, runId) {
  if (!exactly(request, ["topic", "runId", "createdAt", "model", "effort"]) || typeof request.topic !== "string" || request.runId !== runId || request.model !== "gpt-5.6-terra" || request.effort !== "medium" || typeof request.createdAt !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(request.createdAt) || new Date(request.createdAt).toISOString() !== request.createdAt) fail("Invalid request");
}
function validateGlossary(entries, slide) {
  if (!Array.isArray(entries) || entries.length < 1 || entries.length > 2) fail(`Slide ${slide} needs 1–2 glossary entries`);
  entries.forEach((entry, index) => { if (!exactly(entry, ["term", "definition"])) fail(`Invalid glossary entry on slide ${slide}`); text(entry.term, CAPACITY_LIMITS.glossaryTerm, `Slide ${slide} glossary[${index}].term`); text(entry.definition, CAPACITY_LIMITS.glossaryDefinition, `Slide ${slide} glossary[${index}].definition`); });
}
function validateVariant(slide, index, slides) {
  const common = ["number", "role", "variant", "title", "why", "glossary"];
  const required = {
    hero:[...common, "prompt"], fact:[...common, "factValue", "factLabel"], list:[...common, "items"], quote:[...common, "quote", "attribution"], comparison:[...common, "comparison"], levels:[...common, "levels"],
  }[slide.variant];
  if (!required || !exactly(slide, required) || slide.number !== index + 1) fail(`Invalid ${slide.variant ?? "unknown"} slide ${index + 1}`);
  const permittedRoles = index === 0 ? ["hook"] : index === 1 ? ["overview"] : index === slides.length - 1 ? ["takeaway"] : ["concept", "example", "deep-dive", "interview"];
  if (!permittedRoles.includes(slide.role)) fail(`Invalid role on slide ${index + 1}: received ${JSON.stringify(slide.role)}; permitted roles: ${permittedRoles.join(", ")}`);
  text(slide.role, 32, `Slide ${index + 1} role`); text(slide.title, CAPACITY_LIMITS.title, `Slide ${index + 1} title`); text(slide.why, CAPACITY_LIMITS.why, `Slide ${index + 1} why`); validateGlossary(slide.glossary, index + 1);
  if (slide.variant === "hero") text(slide.prompt, CAPACITY_LIMITS.prompt, `Slide ${index + 1} prompt`);
  if (slide.variant === "fact") { text(slide.factValue, CAPACITY_LIMITS.factValue, `Slide ${index + 1} factValue`); text(slide.factLabel, CAPACITY_LIMITS.factLabel, `Slide ${index + 1} factLabel`); }
  if (slide.variant === "list") { if (!Array.isArray(slide.items) || slide.items.length < 2 || slide.items.length > 4) fail(`Slide ${index + 1} list needs 2–4 items`); slide.items.forEach((item, itemIndex) => { if (!exactly(item, ["label", "detail"])) fail(`Invalid list item on slide ${index + 1}`); text(item.label, CAPACITY_LIMITS.itemLabel, `Slide ${index + 1} items[${itemIndex}].label`); text(item.detail, CAPACITY_LIMITS.itemDetail, `Slide ${index + 1} items[${itemIndex}].detail`); }); }
  if (slide.variant === "quote") { text(slide.quote, CAPACITY_LIMITS.quote, `Slide ${index + 1} quote`); text(slide.attribution, CAPACITY_LIMITS.attribution, `Slide ${index + 1} attribution`); }
  if (slide.variant === "comparison") { if (!exactly(slide.comparison, ["left", "right"])) fail(`Invalid comparison on slide ${index + 1}`); ["left", "right"].forEach(side => { const value = slide.comparison[side]; if (!exactly(value, ["label", "summary", "items"])) fail(`Invalid ${side} comparison on slide ${index + 1}`); text(value.label, CAPACITY_LIMITS.comparisonLabel, `Slide ${index + 1} comparison.${side}.label`); text(value.summary, CAPACITY_LIMITS.comparisonSummary, `Slide ${index + 1} comparison.${side}.summary`); textList(value.items, 2, 4, CAPACITY_LIMITS.comparisonItem, `Slide ${index + 1} comparison.${side}.items`); }); }
  if (slide.variant === "levels") { if (!Array.isArray(slide.levels) || slide.levels.length < 2 || slide.levels.length > 4) fail(`Slide ${index + 1} levels needs 2–4 entries`); slide.levels.forEach((level, levelIndex) => { if (!exactly(level, ["label", "value", "description"]) || !Number.isFinite(level.value) || level.value < 0 || level.value > 100) fail(`Invalid level on slide ${index + 1}`); text(level.label, CAPACITY_LIMITS.levelLabel, `Slide ${index +1} levels[${levelIndex}].label`); text(level.description, CAPACITY_LIMITS.levelDescription, `Slide ${index + 1} levels[${levelIndex}].description`); }); }
}
function validateContent(content, topic) {
  text(topic, CAPACITY_LIMITS.topic, "Topic");
  if (!exactly(content, ["topic", "slides"]) || content.topic !== topic || !Array.isArray(content.slides) || content.slides.length < 7 || content.slides.length > 10) fail(`Invalid slide count: ${content.slides?.length ?? "unknown"}; expected 7–10`);
  content.slides.forEach(validateVariant);
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
