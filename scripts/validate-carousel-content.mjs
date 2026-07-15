import { lstatSync, readFileSync, rmSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const HTML = /<!--[\s\S]*?-->|<![A-Za-z][^>]*>|<\?[\s\S]*?\?>|<\/?[A-Za-z][^>]*>|&(?:#\d+|#x[0-9A-Fa-f]+|[A-Za-z][A-Za-z0-9]+);/;
export const CSS = /[^{}\n]+\{[^{}\n]*\}|@[A-Za-z-]+(?:[^;{}]*[;{])/;
export const BLOCK_MARKDOWN = /^(?: {0,3}#{1,6}\s+.*| {0,3}>.*| {0,3}[-+*]\s+.*| {0,3}\d+[.)]\s+.*| {0,3}(?:```|~~~).*| {0,3}(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,}))$/m;
export const INLINE_MARKDOWN = /`[^`\n]+`|!?\[[^\]\n]*\]\([^\n)]*\)|(?:^|[\s\p{P}])(\*{1,3}|_{1,3})(?=\S)[\s\S]+?\1(?=$|[\s\p{P}])/u;

const roles = ["hook", "concept", "breakdown", "example", "comparison", "application", "takeaway"];
const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
const exactly = (value, keys) => object(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const length = value => Array.from(value).length;

function fail(message) { throw new Error(message); }
function readJson(path) {
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch { fail(`Unreadable or invalid JSON: ${basename(path)}`); }
}

export function validateText(value, limit) {
  if (typeof value !== "string" || length(value) < 1 || length(value) > limit) fail("Invalid text length or type");
  if (HTML.test(value) || CSS.test(value) || BLOCK_MARKDOWN.test(value) || INLINE_MARKDOWN.test(value)) fail("Text must be plain prose");
}

function validateRequest(request, runId) {
  for (const key of ["contractVersion", "topic", "runId", "createdAt", "model", "effort"]) if (!Object.hasOwn(request, key)) fail("Missing request field");
  if (request.contractVersion !== "1" || typeof request.topic !== "string" || request.runId !== runId || request.model !== "gpt-5.6-terra" || request.effort !== "medium") fail("Invalid request");
  if (typeof request.createdAt !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(request.createdAt) || new Date(request.createdAt).toISOString() !== request.createdAt) fail("Invalid request timestamp");
}

function validateContent(content, topic) {
  if (!exactly(content, ["version", "topic", "slides"]) || content.version !== "1" || content.topic !== topic || !Array.isArray(content.slides) || content.slides.length !== 7) fail("Invalid content envelope");
  content.slides.forEach((slide, index) => {
    if (!exactly(slide, ["number", "role", "title", "body", "items"]) || slide.number !== index + 1 || slide.role !== roles[index] || !Array.isArray(slide.items) || slide.items.length > 3) fail("Invalid slide");
    validateText(slide.title, 70); validateText(slide.body, 220); slide.items.forEach(item => validateText(item, 80));
  });
}

export function validateRun(runDirectory) {
  const runPath = resolve(runDirectory);
  const runId = basename(runPath);
  const contentPath = join(runPath, "carousel-content.json");
  let safeRun = false;
  try {
    if (basename(dirname(runPath)) !== "runs" || !runId) fail("Invalid run path");
    if (lstatSync(dirname(runPath)).isSymbolicLink() || lstatSync(runPath).isSymbolicLink()) fail("Symlinked run path");
    safeRun = true;
    const requestPath = join(runPath, "request.json");
    if (lstatSync(requestPath).isSymbolicLink()) fail("Symlinked request path");
    const request = readJson(requestPath);
    validateRequest(request, runId);
    if (lstatSync(contentPath).isSymbolicLink()) fail("Symlinked content path");
    const content = readJson(contentPath);
    validateContent(content, request.topic);
    return content;
  } catch (error) {
    if (safeRun) {
      try { if (lstatSync(contentPath).isFile() && !lstatSync(contentPath).isSymbolicLink()) rmSync(contentPath); }
      catch { /* Missing or unsafe expected artifact is retained. */ }
    }
    throw error;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { validateRun(process.argv[2] ?? ""); }
  catch (error) { console.error(`Validation failed: ${error.message}`); process.exitCode = 1; }
}
