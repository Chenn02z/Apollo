import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { finishComposition, logDiagnostic, readCompositionState, restoreRenderer, validateComposition } from "./compose-carousel.mjs";
import { validateLayout } from "./validate-carousel-layout.mjs";
import { validateRun } from "./validate-carousel-content.mjs";

const fail = (code, message) => { throw new Error(`${code}: ${message}`); };
const stat = path => { try { return lstatSync(path); } catch { return null; } };
const isFile = path => { const value = stat(path); return value?.isFile() && !value.isSymbolicLink(); };
const isDirectory = path => { const value = stat(path); return value?.isDirectory() && !value.isSymbolicLink(); };
const paths = count => Array.from({ length:count }, (_, index) => `slides/slide-${String(index + 1).padStart(2, "0")}.png`);
const manifestFor = (runId, count) => ({ runId, width:1080, height:1350, slideCount:count, slides:paths(count) });
const exactly = (value, keys) => value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));

export function scanHtml(html, count) {
  const slides = [...html.matchAll(/<([a-z][a-z0-9]*)\b[^>]*data-slide="([0-9]+)"[^>]*>/gi)].map(match => match[2]);
  if (slides.join() !== Array.from({ length:count }, (_, index) => String(index + 1)).join()) fail("ASSEMBLY_OUTPUT", `expected ${count} ordered data-slide elements`);
}

function validManifest(run, count) {
  try {
    const path = join(run, "render-manifest.json"); if (!isFile(path) || !isDirectory(join(run, "slides")) || !isFile(join(run, "composition.html")) || !isFile(join(run, "index.html"))) return false;
    const value = JSON.parse(readFileSync(path, "utf8")); if (!exactly(value, ["runId", "width", "height", "slideCount", "slides"]) || value.runId !== basename(run) || value.width !== 1080 || value.height !== 1350 || value.slideCount !== count || !Array.isArray(value.slides) || value.slides.join() !== paths(count).join()) return false;
    return paths(count).every(name => isFile(join(run, name)) && pngSize(join(run, name)).width === 1080 && pngSize(join(run, name)).height === 1350);
  } catch { return false; }
}

export function pngSize(path) { const bytes = readFileSync(path); if (bytes.length < 24 || bytes.toString("ascii", 1, 4) !== "PNG" || bytes.toString("ascii", 12, 16) !== "IHDR") fail("RENDER_EXPORT", "invalid PNG"); return { width:bytes.readUInt32BE(16), height:bytes.readUInt32BE(20) }; }
export async function verifyExport(runDirectory, { chromium } = {}) {
  const run = resolve(runDirectory), content = validateRun(run), html = readFileSync(join(run, "composition.html"), "utf8"), path = join(run, "index.html");
  validateLayout(run, content); if (!isFile(path) || readFileSync(path, "utf8") !== html) fail("ASSEMBLY_FIDELITY", "index.html differs from composition.html");
  scanHtml(html, content.slides.length); if (!validManifest(run, content.slides.length)) fail("RENDER_PUBLICATION", "invalid complete renderer set"); return content;
}
export async function exportRun(runDirectory, { chromium, stateFile } = {}) {
  const run = resolve(runDirectory), state = readCompositionState(run, stateFile), stage = mkdtempSync(join(tmpdir(), "apollo-render-stage-")); let browser, published = false;
  try {
    const { content, html } = validateComposition(run, state), count = content.slides.length; scanHtml(html, count);
    if (!chromium) ({ chromium } = await import("playwright")); browser = await chromium.launch(); const page = await browser.newPage({ viewport:{ width:1080, height:1350 }, deviceScaleFactor:1 }); await page.setContent(html, { waitUntil:"load" }); await page.evaluate(() => document.fonts?.ready);
    const stagedSlides = join(stage, "slides"); mkdirSync(stagedSlides);
    for (let index = 0; index < count; index++) { const locator = page.locator(`[data-slide="${index + 1}"]`).first(), box = await locator.evaluate(element => { const { width,height } = element.getBoundingClientRect(); return { width,height }; }); if (Math.round(box.width) !== 1080 || Math.round(box.height) !== 1350) fail("RENDER_EXPORT", `slide ${index + 1} dimensions: ${box.width}x${box.height}`); await locator.screenshot({ path:join(stagedSlides, `slide-${String(index + 1).padStart(2, "0")}.png`) }); }
    for (const name of paths(count)) { const size = pngSize(join(stage, name)); if (size.width !== 1080 || size.height !== 1350) fail("RENDER_EXPORT", "staged PNG dimensions"); }
    const fresh = validateComposition(run, state); scanHtml(fresh.html, count);
    await browser.close(); browser = null;
    const stagedHtml = join(stage, "index.html"), stagedManifest = join(stage, "render-manifest.json"); writeFileSync(stagedHtml, html); writeFileSync(stagedManifest, `${JSON.stringify(manifestFor(basename(run), count), null, 2)}\n`);
    rmSync(join(run, "index.html"), { force:true }); rmSync(join(run, "slides"), { recursive:true, force:true }); renameSync(stagedHtml, join(run, "index.html")); renameSync(stagedSlides, join(run, "slides"));
    validateLayout(run, content); if (readFileSync(join(run, "index.html"), "utf8") !== readFileSync(join(run, "composition.html"), "utf8")) fail("ASSEMBLY_FIDELITY", "published HTML mismatch");
    renameSync(stagedManifest, join(run, "render-manifest.json")); published = true; finishComposition(state, stateFile); return content;
  } catch (error) { restoreRenderer(run, state); logDiagnostic(run, { run, stage:"render", diagnostic:error.message }); throw error; }
  finally { if (browser) await browser.close(); if (existsSync(stage)) rmSync(stage, { recursive:true, force:true }); if (!published && state.backup && existsSync(state.backup)) rmSync(state.backup, { recursive:true, force:true }); }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , run, flag, stateFile] = process.argv;
  if (flag !== "--state-file" || !stateFile) { console.error("COMPOSER_RUN_OR_TEMPLATE arguments"); process.exitCode = 1; }
  else exportRun(run ?? "", { stateFile }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
