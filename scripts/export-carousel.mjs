import { cpSync, existsSync, lstatSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { validateRun } from "./validate-carousel-content.mjs";
import { populateHtml } from "./populate-carousel.mjs";

const fail = message => { throw new Error(message); };
const isFile = path => { try { return lstatSync(path).isFile() && !lstatSync(path).isSymbolicLink(); } catch { return false; } };
const isDirectory = path => { try { return lstatSync(path).isDirectory() && !lstatSync(path).isSymbolicLink(); } catch { return false; } };
const paths = count => Array.from({ length: count }, (_, index) => `slides/slide-${String(index + 1).padStart(2, "0")}.png`);
const manifestFor = (runId, count) => ({ runId, width: 1080, height: 1350, slideCount: count, slides: paths(count) });
const exactly = (value, keys) => value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const typography = [".masthead", ".section-label", ".content h1", ".footer"];
const typeProperties = ["fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight", "letterSpacing", "textTransform"];
const referenceContent = { topic: "reference", slides: [{ number: 1, role: "hook", variant: "hero", title: "Reference", why: "Reference layout.", prompt: "Reference prompt.", glossary: [{ term: "Reference", definition: "A local baseline." }] }] };

export function scanHtml(html, count) {
  const css = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(match => match[1]).join("\n").replace(/\\([0-9a-f]{1,6})\s?/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)));
  if (/<\/?(?:script|link|base|meta)\b/i.test(html) || /\s(?:src|href|xlink:href|style|on[a-z]+|action|formaction|poster|data|cite|background|longdesc|usemap)\s*=/i.test(html) || /@import\b|url\s*\(|(?:overflow|overflow-x|overflow-y)\s*:\s*(?:hidden|clip)\b/i.test(css)) fail("HTML contains a prohibited construct");
  const stack = []; const roots = []; let carousel = 0; let dataSlides = 0;
  for (const match of html.matchAll(/<\/?[A-Za-z][^>]*>/g)) {
    const tag = match[0]; if (tag.startsWith("</")) { stack.pop(); continue; }
    const name = tag.match(/^<\s*([A-Za-z]+)/)?.[1]?.toLowerCase(); const data = tag.match(/\bdata-slide\s*=\s*(['"])(.*?)\1/i)?.[2]; if (data !== undefined) dataSlides++;
    const parent = stack.at(-1); const hereCarousel = /\bid\s*=\s*(['"])carousel\1/i.test(tag); if (hereCarousel) carousel++;
    const root = parent?.carousel && name === "section" && /\bclass\s*=\s*(['"])[^'"]*\bcarousel-slide\b[^'"]*\1/i.test(tag) && data !== undefined;
    const node = { carousel: hereCarousel || parent?.carousel === true, content: /\bclass\s*=\s*(['"])[^'"]*\bslide-content\b[^'"]*\1/i.test(tag), children: [], data };
    if (parent) parent.children.push(node); if (root) roots.push(node);
    if (!/\/$/.test(tag) && !/^(?:br|hr|img|input|meta|link)$/i.test(name)) stack.push(node);
  }
  if (carousel !== 1 || roots.length !== count || dataSlides !== count || roots.some((root, index) => root.data !== String(index + 1)) || roots.some(root => root.children.length !== 1 || !root.children[0].content)) fail(`HTML must contain one carousel with ${count} ordered roots and one direct .slide-content child`);
}

function validManifest(run, count) {
  try {
    const manifestPath = join(run, "render-manifest.json"); if (!isFile(manifestPath) || !isDirectory(join(run, "slides"))) return false;
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (!exactly(manifest, ["runId", "width", "height", "slideCount", "slides"]) || manifest.runId !== basename(run) || manifest.width !== 1080 || manifest.height !== 1350 || manifest.slideCount !== count || !Array.isArray(manifest.slides) || manifest.slides.length !== count || manifest.slides.some((path, index) => path !== paths(count)[index])) return false;
    return paths(count).every(path => { if (!isFile(join(run, path))) return false; const size = pngSize(join(run, path)); return size.width === 1080 && size.height === 1350; });
  } catch { return false; }
}
export async function verifyExport(runDirectory, { chromium } = {}) {
  const content = validateRun(runDirectory), count = content.slides.length, run = resolve(runDirectory), htmlPath = join(run, "index.html");
  if (basename(dirname(run)) !== "runs" || !isFile(htmlPath)) fail("Missing renderer HTML");
  const html = readFileSync(htmlPath, "utf8");
  if (html !== populateHtml(content)) fail("Template fidelity failed: index.html is not the canonical shell expansion");
  scanHtml(html, count); if (!validManifest(run, count)) fail("Invalid publication"); if (!chromium) ({ chromium } = await import("playwright"));
  await inspectDom(html, count, { chromium });
  return content;
}
export async function inspectDom(html, count, { chromium } = {}) {
  if (!chromium) ({ chromium } = await import("playwright")); let browser;
  try {
    browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 }), reference = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 }); let routed = false;
    for (const target of [page, reference]) await target.route("**/*", route => { routed = true; return route.abort(); });
    await reference.setContent(populateHtml(referenceContent), { waitUntil: "load" }); await page.setContent(html, { waitUntil: "load" }); if (routed) fail("A subresource route was attempted");
    const baseline = await reference.evaluate(({ typography, typeProperties }) => Object.fromEntries(typography.map(selector => [selector, Object.fromEntries(typeProperties.map(property => [property, getComputedStyle(document.querySelector(selector)).getPropertyValue(property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`))]))])), { typography, typeProperties });
    const result = await page.evaluate(({ typography, typeProperties, baseline }) => {
      const roots = [...document.querySelectorAll("#carousel > section.carousel-slide[data-slide]")], violations = [];
      roots.forEach((root, slide) => { const rootRect = root.getBoundingClientRect(); [root, ...root.querySelectorAll("*")].forEach(node => { const style = getComputedStyle(node), place = node === root ? "root" : "descendant", rect = node.getBoundingClientRect(), width = Math.ceil(rect.width - parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth)), height = Math.ceil(rect.height - parseFloat(style.borderTopWidth) - parseFloat(style.borderBottomWidth)); for (const property of ["overflow", "overflowX", "overflowY"]) if (["hidden", "clip"].includes(style[property])) violations.push(`slide ${slide + 1}: ${place} has prohibited ${property}`); if (node.scrollWidth > width) violations.push(`slide ${slide + 1}: ${place} width overflowed (${node.scrollWidth} > ${width})`); if (node.scrollHeight > height) violations.push(`slide ${slide + 1}: ${place} height overflowed (${node.scrollHeight} > ${height})`); if (node !== root && style.display !== "none" && style.visibility !== "hidden") { for (const [edge, actual, bound] of [["left", rect.left, rootRect.left], ["top", rect.top, rootRect.top], ["right", rect.right, rootRect.right], ["bottom", rect.bottom, rootRect.bottom]]) if ((edge === "left" || edge === "top") ? actual < bound : actual > bound) violations.push(`slide ${slide + 1}: descendant rect escaped ${edge} (${actual} vs ${bound})`); } }); typography.forEach(selector => { const node = root.querySelector(selector); typeProperties.forEach(property => { const value = getComputedStyle(node).getPropertyValue(property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)); if (value !== baseline[selector][property]) violations.push(`slide ${slide + 1}: ${selector} typography ${property} (${value} vs ${baseline[selector][property]})`); }); }); });
      return violations;
    }, { typography, typeProperties, baseline });
    if (result.length) fail(result[0]);
  } finally { if (browser) await browser.close(); }
}
function snapshot(run, count) {
  if (!validManifest(run, count)) return null;
  const backup = mkdtempSync(join(tmpdir(), "apollo-render-backup-")); cpSync(join(run, "slides"), join(backup, "slides"), { recursive: true }); cpSync(join(run, "render-manifest.json"), join(backup, "render-manifest.json")); return backup;
}
function restore(run, backup) {
  rmSync(join(run, "render-manifest.json"), { force: true }); rmSync(join(run, "slides"), { recursive: true, force: true });
  if (backup) { cpSync(join(backup, "slides"), join(run, "slides"), { recursive: true }); cpSync(join(backup, "render-manifest.json"), join(run, "render-manifest.json")); }
}

export function pngSize(path) { const bytes = readFileSync(path); if (bytes.length < 24 || bytes.toString("ascii", 1, 4) !== "PNG" || bytes.toString("ascii", 12, 16) !== "IHDR") fail("Invalid PNG"); return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }; }
export async function exportRun(runDirectory, { chromium } = {}) {
  const content = validateRun(runDirectory); const count = content.slides.length; const run = resolve(runDirectory); const runId = basename(run); const htmlPath = join(run, "index.html");
  if (!validManifest(run, count)) rmSync(join(run, "render-manifest.json"), { force: true });
  if (basename(dirname(run)) !== "runs" || !isFile(htmlPath)) fail("Missing renderer HTML");
  const html = readFileSync(htmlPath, "utf8");
  if (html !== populateHtml(content)) fail("Template fidelity failed: index.html is not the canonical shell expansion");
  scanHtml(html, count); if (!chromium) ({ chromium } = await import("playwright"));
  await inspectDom(html, count, { chromium });
  const stage = mkdtempSync(join(tmpdir(), "apollo-render-stage-")); let browser;
  try {
    browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 }); let routed = false;
    await page.route("**/*", route => { routed = true; return route.abort(); }); await page.setContent(html, { waitUntil: "load" }); if (routed) fail("A subresource route was attempted");
    const inspection = await page.evaluate(({ typography, typeProperties }) => {
      const roots = [...document.querySelectorAll("#carousel > section.carousel-slide[data-slide]")], slides = [...document.querySelectorAll("[data-slide]")].map(node => node.getAttribute("data-slide")), violations = [];
      const baseline = Object.fromEntries(typography.map(selector => [selector, Object.fromEntries(typeProperties.map(property => [property, getComputedStyle(roots[0].querySelector(selector)).getPropertyValue(property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`))]))]));
      roots.forEach((root, slide) => { if (root.children.length !== 1 || !root.firstElementChild?.classList.contains("slide-content")) violations.push(`slide ${slide + 1}: root must have one direct .slide-content child`); const rootRect = root.getBoundingClientRect(); [root, ...root.querySelectorAll("*")].forEach(node => { const style = getComputedStyle(node), place = node === root ? "root" : "descendant", rect = node.getBoundingClientRect(), width = Math.ceil(rect.width - parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth)), height = Math.ceil(rect.height - parseFloat(style.borderTopWidth) - parseFloat(style.borderBottomWidth)); for (const property of ["overflow", "overflowX", "overflowY"]) if (["hidden", "clip"].includes(style[property])) violations.push(`slide ${slide + 1}: ${place} has prohibited ${property}`); if (node.scrollWidth > width) violations.push(`slide ${slide + 1}: ${place} width overflowed (${node.scrollWidth} > ${width})`); if (node.scrollHeight > height) violations.push(`slide ${slide + 1}: ${place} height overflowed (${node.scrollHeight} > ${height})`); if (node !== root && style.display !== "none" && style.visibility !== "hidden") { for (const [edge, actual, bound] of [["left", rect.left, rootRect.left], ["top", rect.top, rootRect.top], ["right", rect.right, rootRect.right], ["bottom", rect.bottom, rootRect.bottom]]) if ((edge === "left" || edge === "top") ? actual < bound : actual > bound) violations.push(`slide ${slide + 1}: descendant rect escaped ${edge} (${actual} vs ${bound})`); } }); });
      roots.forEach((root, slide) => typography.forEach(selector => typeProperties.forEach(property => { const value = getComputedStyle(root.querySelector(selector)).getPropertyValue(property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)); if (value !== baseline[selector][property]) violations.push(`slide ${slide + 1}: ${selector} typography ${property} (${value} vs ${baseline[selector][property]})`); })));
      return { roots: roots.length, slides, violations };
    }, { typography, typeProperties });
    if (inspection.roots !== count || inspection.slides.join(",") !== Array.from({ length: count }, (_, index) => String(index + 1)).join(",")) fail("HTML slide structure is invalid"); if (inspection.violations.length) fail(inspection.violations[0]);
    for (let index = 0; index < count; index++) { const locator = page.locator(`#carousel > section.carousel-slide[data-slide=\"${index + 1}\"]`); const box = await locator.evaluate(element => { const { width, height } = element.getBoundingClientRect(); return { width, height }; }); if (box.width !== 1080 || box.height !== 1350) fail(`Slide ${index + 1} dimensions must be 1080x1350`); await locator.screenshot({ path: join(stage, `slide-${String(index + 1).padStart(2, "0")}.png`) }); }
    await browser.close(); browser = null;
    for (const path of paths(count)) { const size = pngSize(join(stage, basename(path))); if (size.width !== 1080 || size.height !== 1350) fail("Staged PNG dimensions are invalid"); }
    const backup = snapshot(run, count);
    try { rmSync(join(run, "render-manifest.json"), { force: true }); rmSync(join(run, "slides"), { recursive: true, force: true }); renameSync(stage, join(run, "slides")); for (const path of paths(count)) { const size = pngSize(join(run, path)); if (size.width !== 1080 || size.height !== 1350) fail("Published PNG dimensions are invalid"); } writeFileSync(join(run, "render-manifest.json"), `${JSON.stringify(manifestFor(runId, count), null, 2)}\n`); }
    catch (error) { restore(run, backup); throw error; } finally { if (backup) rmSync(backup, { recursive: true, force: true }); }
  } finally { if (browser) await browser.close(); if (existsSync(stage)) rmSync(stage, { recursive: true, force: true }); }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) exportRun(process.argv[2] ?? "").catch(error => { console.error(`Render failed: ${error.message}`); process.exitCode = 1; });
