import { lstatSync, readFileSync, rmSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateText } from "./validate-carousel-content.mjs";

const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
const exactly = (value, keys) => object(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const fail = message => { throw new Error(message); };
const readJson = path => { try { return JSON.parse(readFileSync(path, "utf8")); } catch { fail(`Unreadable or invalid JSON: ${basename(path)}`); } };

function validateRequest(request, runId) {
  if (!exactly(request, ["contractVersion", "topic", "runId", "createdAt", "model", "effort"]) || request.contractVersion !== "2" || typeof request.topic !== "string" || request.runId !== runId || request.model !== "gpt-5.6-terra" || request.effort !== "medium" || typeof request.createdAt !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(request.createdAt) || new Date(request.createdAt).toISOString() !== request.createdAt) fail("Invalid request");
}

function validateContent(content, topic) {
  if (!exactly(content, ["version", "topic", "slides"]) || content.version !== "2" || content.topic !== topic || !Array.isArray(content.slides) || content.slides.length < 6 || content.slides.length > 10) fail(`Invalid slide count: ${content.slides?.length ?? "unknown"}; expected 6–10`);
  content.slides.forEach((slide, index) => {
    if (!exactly(slide, ["number", "role", "title", "body", "items"]) || slide.number !== index + 1 || !Array.isArray(slide.items) || slide.items.length > 4) fail(`Invalid slide ${index + 1}`);
    const permittedRoles = index === 0 ? ["hook"] : index === 1 ? ["overview"] : index === content.slides.length - 1 ? ["takeaway"] : ["concept", "example", "deep-dive", "interview"];
    if (!permittedRoles.includes(slide.role)) fail(`Invalid role on slide ${index + 1}: received ${JSON.stringify(slide.role)}; permitted roles: ${permittedRoles.join(", ")}`);
    validateText(slide.title, 80); validateText(slide.body, 300); slide.items.forEach(item => validateText(item, 100));
  });
}

export function validateRunV2(runDirectory) {
  const runPath = resolve(runDirectory); const runId = basename(runPath); const contentPath = join(runPath, "carousel-content-v2.json"); let safe = false;
  try {
    if (basename(dirname(runPath)) !== "runs" || !runId || lstatSync(dirname(runPath)).isSymbolicLink() || lstatSync(runPath).isSymbolicLink()) fail("Invalid run path");
    safe = true;
    const requestPath = join(runPath, "request-v2.json");
    if (lstatSync(requestPath).isSymbolicLink() || lstatSync(contentPath).isSymbolicLink()) fail("Symlinked v2 artifact");
    const request = readJson(requestPath); validateRequest(request, runId);
    const content = readJson(contentPath); validateContent(content, request.topic); return content;
  } catch (error) {
    if (safe) try { if (lstatSync(contentPath).isFile() && !lstatSync(contentPath).isSymbolicLink()) rmSync(contentPath); } catch { /* preserve missing and unsafe artifacts */ }
    throw error;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { validateRunV2(process.argv[2] ?? ""); }
  catch (error) { console.error(`Validation failed: ${error.message}`); process.exitCode = 1; }
}
