import { cpSync, existsSync, lstatSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const slides = Array.from({ length: 7 }, (_, index) => `slides/slide-${String(index + 1).padStart(2, "0")}.png`);
const manifestFor = runId => ({ version: "1", runId, sourceContentVersion: "1", width: 1080, height: 1350, slideCount: 7, slides });
const fail = message => { throw new Error(message); };
const isFile = path => { try { return lstatSync(path).isFile() && !lstatSync(path).isSymbolicLink(); } catch { return false; } };

export function scanHtml(html) {
  if (/<\/?(?:script|link|base|meta)\b/i.test(html) || /\s(?:src|href|xlink:href|style|on[a-z]+|action|formaction|poster|data|cite|background|longdesc|usemap)\s*=/i.test(html) || /@import\b/i.test(html) || /@\s*\\[0-9a-f]{1,6}\s*/i.test(html)) fail("HTML contains a prohibited construct");
  for (const match of html.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)) if (!/^data:font\/woff2;base64,[A-Za-z0-9+/]+={0,2}$/.test(match[2])) fail("HTML contains a prohibited CSS URL");
  for (const style of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) if (/(?:u|\\0{0,4}75\s*)(?:r|\\0{0,4}72\s*)(?:l|\\0{0,4}6c\s*)\s*\(/i.test(style[1])) fail("HTML contains an escaped CSS URL");
  const tags = [...html.matchAll(/<\/?[A-Za-z][^>]*>/g)]; let depth = 0; let carouselDepth = -1; let carousels = 0; const roots = []; let dataSlides = 0;
  for (const match of tags) {
    const tag = match[0]; const closing = tag.startsWith("</"); const name = tag.match(/^<\/?\s*([A-Za-z]+)/)?.[1]?.toLowerCase();
    if (closing) { depth--; continue; }
    const data = tag.match(/\bdata-slide\s*=\s*(['"])(.*?)\1/i)?.[2]; if (data !== undefined) dataSlides++;
    if (/\bid\s*=\s*(['"])carousel\1/i.test(tag)) { carouselDepth = depth; carousels++; }
    if (carouselDepth >= 0 && depth === carouselDepth + 1 && name === "section" && /\bclass\s*=\s*(['"])[^'"]*\bcarousel-slide\b[^'"]*\1/i.test(tag) && data !== undefined) roots.push(data);
    if (!/\/$/.test(tag) && !/^(?:meta|img|br|hr|input|link)$/i.test(name)) depth++;
  }
  if (carousels !== 1 || roots.length !== 7 || dataSlides !== 7 || roots.some((value, index) => value !== String(index + 1))) fail("HTML must contain one carousel with seven ordered direct slide roots");
}

export function pngSize(path) {
  const bytes = readFileSync(path);
  if (bytes.length < 24 || bytes.toString("ascii", 1, 4) !== "PNG" || bytes.toString("ascii", 12, 16) !== "IHDR") fail("Invalid PNG");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function validManifest(run) {
  const path = join(run, "render-manifest.json");
  try {
    const manifest = JSON.parse(readFileSync(path, "utf8"));
    if (JSON.stringify(manifest) !== JSON.stringify(manifestFor(basename(run)))) return false;
    return slides.every(slide => { const size = pngSize(join(run, slide)); return size.width === 1080 && size.height === 1350; });
  } catch { return false; }
}

function snapshot(run) {
  if (!validManifest(run)) { rmSync(join(run, "render-manifest.json"), { force: true }); return null; }
  const backup = mkdtempSync(join(tmpdir(), "apollo-render-backup-"));
  cpSync(join(run, "slides"), join(backup, "slides"), { recursive: true });
  cpSync(join(run, "render-manifest.json"), join(backup, "render-manifest.json"));
  return backup;
}

function restore(run, backup) {
  rmSync(join(run, "render-manifest.json"), { force: true });
  rmSync(join(run, "slides"), { recursive: true, force: true });
  if (backup) { cpSync(join(backup, "slides"), join(run, "slides"), { recursive: true }); cpSync(join(backup, "render-manifest.json"), join(run, "render-manifest.json")); }
}

export async function exportRun(runDirectory, { chromium } = {}) {
  const run = resolve(runDirectory); const runId = basename(run);
  if (basename(dirname(run)) !== "runs" || !isFile(join(run, "index.html"))) fail("Missing renderer HTML");
  const html = readFileSync(join(run, "index.html"), "utf8"); scanHtml(html);
  if (!chromium) ({ chromium } = await import("playwright"));
  const stage = mkdtempSync(join(tmpdir(), "apollo-render-stage-")); let browser;
  try {
    browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
    let routed = false; await page.route("**/*", route => { routed = true; return route.abort(); });
    await page.setContent(html, { waitUntil: "load" });
    if (routed) fail("A subresource route was attempted");
    const structure = await page.evaluate(() => ({
      roots: document.querySelectorAll("#carousel > section.carousel-slide[data-slide]").length,
      slides: [...document.querySelectorAll("[data-slide]")].map(node => node.getAttribute("data-slide")),
    }));
    if (structure.roots !== 7 || structure.slides.join(",") !== "1,2,3,4,5,6,7") fail("HTML slide structure is invalid");
    for (let index = 0; index < 7; index++) {
      const locator = page.locator(`#carousel > section.carousel-slide[data-slide=\"${index + 1}\"]`);
      const box = await locator.evaluate(element => { const { width, height } = element.getBoundingClientRect(); return { width, height }; });
      if (box.width !== 1080 || box.height !== 1350) fail("Slide dimensions must be 1080x1350");
      await locator.screenshot({ path: join(stage, `slide-${String(index + 1).padStart(2, "0")}.png`) });
    }
    await browser.close(); browser = null;
    for (const name of slides.map(value => basename(value))) { const size = pngSize(join(stage, name)); if (size.width !== 1080 || size.height !== 1350) fail("Staged PNG dimensions are invalid"); }
    const backup = snapshot(run);
    try {
      rmSync(join(run, "render-manifest.json"), { force: true });
      rmSync(join(run, "slides"), { recursive: true, force: true }); renameSync(stage, join(run, "slides"));
      for (const slide of slides) { const size = pngSize(join(run, slide)); if (size.width !== 1080 || size.height !== 1350) fail("Published PNG dimensions are invalid"); }
      writeFileSync(join(run, "render-manifest.json"), `${JSON.stringify(manifestFor(runId), null, 2)}\n`);
    } catch (error) { restore(run, backup); throw error; }
    finally { if (backup) rmSync(backup, { recursive: true, force: true }); }
  } finally { if (browser) await browser.close(); if (existsSync(stage)) rmSync(stage, { recursive: true, force: true }); }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  exportRun(process.argv[2] ?? "").catch(error => { console.error(`Render failed: ${error.message}`); process.exitCode = 1; });
}
