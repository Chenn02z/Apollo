import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { assembleHtml, finishComposition, logDiagnostic, readCompositionState, restoreRenderer, validateComposition, validateFragmentSet } from "./compose-carousel.mjs";
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
  const css = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(match => match[1]).join("\n").replace(/\\([0-9a-f]{1,6})\s?/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)));
  if (/<\/?(?:script|link|base|meta|template)\b/i.test(html) || /\s(?:src|href|xlink:href|style|on[a-z]+|action|formaction|poster|data|cite|background|longdesc|usemap)\s*=/i.test(html) || /@import\b|url\s*\(|(?:overflow|overflow-x|overflow-y)\s*:\s*(?:hidden|clip)\b/i.test(css)) fail("ASSEMBLY_OUTPUT", "prohibited assembled HTML");
  const stack = [], roots = []; let carousel = 0, dataSlides = 0, bodies = 0;
  for (const match of html.matchAll(/<\/?[A-Za-z][^>]*>/g)) {
    const tag = match[0]; if (tag.startsWith("</")) { stack.pop(); continue; }
    const name = tag.match(/^<\s*([A-Za-z]+)/)?.[1]?.toLowerCase(), parent = stack.at(-1), data = tag.match(/\bdata-slide="([^"]*)"/i)?.[1], hereCarousel = /\bid="carousel"/i.test(tag);
    if (hereCarousel) carousel++; if (data !== undefined) dataSlides++; if (/\bclass="[^"]*\bslide-body\b/i.test(tag)) bodies++;
    const root = parent?.carousel && name === "section" && /\bclass="[^"]*\bcarousel-slide\b/i.test(tag) && data !== undefined;
    const node = { carousel:hereCarousel || parent?.carousel === true, content:/\bclass="[^"]*\bslide-content\b/i.test(tag), children:[], data };
    if (parent) parent.children.push(node); if (root) roots.push(node); if (!/\/$/.test(tag)) stack.push(node);
  }
  if (carousel !== 1 || roots.length !== count || dataSlides !== count || bodies !== count || roots.some((root, index) => root.data !== String(index + 1)) || roots.some(root => root.children.length !== 1 || !root.children[0].content)) fail("ASSEMBLY_OUTPUT", `expected ${count} ordered fixed-shell slides`);
}

function validManifest(run, count) {
  try {
    const path = join(run, "render-manifest.json"); if (!isFile(path) || !isDirectory(join(run, "slides")) || !isDirectory(join(run, "slide-bodies")) || !isFile(join(run, "index.html"))) return false;
    const value = JSON.parse(readFileSync(path, "utf8")); if (!exactly(value, ["runId", "width", "height", "slideCount", "slides"]) || value.runId !== basename(run) || value.width !== 1080 || value.height !== 1350 || value.slideCount !== count || !Array.isArray(value.slides) || value.slides.join() !== paths(count).join()) return false;
    return paths(count).every(name => isFile(join(run, name)) && pngSize(join(run, name)).width === 1080 && pngSize(join(run, name)).height === 1350);
  } catch { return false; }
}

async function inspectPage(page, html, count) {
  let routed = false; await page.route("**/*", route => { routed = true; return route.abort(); }); await page.setContent(html, { waitUntil:"load" }); if (routed) fail("RENDER_EXPORT", "network route attempted");
  const result = await page.evaluate(async expected => {
    await document.fonts.ready;
    const roots = [...document.querySelectorAll("#carousel > section.carousel-slide[data-slide]")], slides = [...document.querySelectorAll("[data-slide]")].map(node => node.getAttribute("data-slide")), violations = [];
    const elementPath = (host, node) => { const parts = []; for (let value = node; value && value !== host; value = value.parentElement) parts.unshift([...value.parentElement.children].indexOf(value)); return `/body/${parts.join("/")}`; };
    roots.forEach((root, index) => {
      const number = index + 1, rootRect = root.getBoundingClientRect(), hosts = root.querySelectorAll(".slide-body"); if (hosts.length !== 1) { violations.push(`BODY_OVERFLOW slide ${number} /body: expected one reserved body`); return; }
      const host = hosts[0], hostRect = host.getBoundingClientRect(), hostOverflow = host.scrollWidth > host.clientWidth || host.scrollHeight > host.clientHeight; if (hostRect.width <= 0 || hostRect.height <= 0) violations.push(`BODY_OVERFLOW slide ${number} /body: reserved body has no positive area`);
      [host, ...host.querySelectorAll("*")].forEach(node => {
        const style = getComputedStyle(node), svg = node instanceof SVGElement, path = node.getAttribute("data-binding") ?? (node === host ? "/body" : elementPath(host, node));
        if (!svg) for (const property of ["overflow", "overflowX", "overflowY"]) if (["hidden", "clip"].includes(style[property])) violations.push(`BODY_OVERFLOW slide ${number} ${path}: prohibited ${property}`);
        if (node === host || style.display === "none" || style.visibility === "hidden") return;
        for (const rect of node.getClientRects()) for (const [edge, actual, bound, low] of [["left",rect.left,hostRect.left,true],["top",rect.top,hostRect.top,true],["right",rect.right,hostRect.right,false],["bottom",rect.bottom,hostRect.bottom,false]]) if (low ? actual < bound - .5 : actual > bound + .5) violations.push(`BODY_OVERFLOW slide ${number} ${path}: crossed ${edge}`);
      });
      if (hostOverflow) violations.push(`BODY_OVERFLOW slide ${number} /body: reserved body overflow`);
      [root, ...root.querySelectorAll("*")].forEach(node => { const style = getComputedStyle(node), rect = node.getBoundingClientRect(), path = node === root ? "/slide" : elementPath(root, node).replace("/body", "/slide"); if (node.scrollWidth > Math.ceil(rect.width) || node.scrollHeight > Math.ceil(rect.height)) violations.push(`RENDER_EXPORT slide ${number} ${path}: ${node.tagName.toLowerCase()} overflowed (${node.scrollWidth}x${node.scrollHeight} > ${Math.ceil(rect.width)}x${Math.ceil(rect.height)})`); if (node !== root && style.display !== "none" && style.visibility !== "hidden") for (const [actual,bound,low] of [[rect.left,rootRect.left,true],[rect.top,rootRect.top,true],[rect.right,rootRect.right,false],[rect.bottom,rootRect.bottom,false]]) if (low ? actual < bound : actual > bound) violations.push(`RENDER_EXPORT slide ${number} ${path}: descendant escaped slide`); });
    });
    return { roots:roots.length, slides, violations, expected };
  }, count);
  if (result.roots !== count || result.slides.join() !== Array.from({ length:count }, (_, index) => String(index + 1)).join()) fail("RENDER_EXPORT", "invalid slide identity");
  if (result.violations.length) throw new Error(result.violations[0]);
}

export async function inspectDom(html, count, { chromium } = {}) {
  if (!chromium) ({ chromium } = await import("playwright")); let browser;
  try { browser = await chromium.launch(); const page = await browser.newPage({ viewport:{ width:1080, height:1350 }, deviceScaleFactor:1 }); await inspectPage(page, html, count); }
  finally { if (browser) await browser.close(); }
}

export function pngSize(path) { const bytes = readFileSync(path); if (bytes.length < 24 || bytes.toString("ascii", 1, 4) !== "PNG" || bytes.toString("ascii", 12, 16) !== "IHDR") fail("RENDER_EXPORT", "invalid PNG"); return { width:bytes.readUInt32BE(16), height:bytes.readUInt32BE(20) }; }

export async function verifyExport(runDirectory, { chromium } = {}) {
  const run = resolve(runDirectory), content = validateRun(run), layout = validateLayout(run, content), { fragments } = validateFragmentSet(run, content, layout), canonical = assembleHtml(content, layout, fragments), path = join(run, "index.html");
  if (!isFile(path) || readFileSync(path, "utf8") !== canonical) fail("ASSEMBLY_FIDELITY", "index.html differs from canonical recomputation");
  scanHtml(canonical, content.slides.length); if (!validManifest(run, content.slides.length)) fail("RENDER_PUBLICATION", "invalid complete renderer set"); await inspectDom(canonical, content.slides.length, { chromium }); return content;
}

export async function exportRun(runDirectory, { chromium, stateFile } = {}) {
  const run = resolve(runDirectory), state = readCompositionState(run, stateFile), stage = mkdtempSync(join(tmpdir(), "apollo-render-stage-")); let browser, published = false;
  try {
    const { content, html, warnings } = validateComposition(run, state), count = content.slides.length; warnings.forEach(warning => logDiagnostic(run, { run, stage:"composer", ...warning })); scanHtml(html, count);
    if (!chromium) ({ chromium } = await import("playwright")); browser = await chromium.launch(); const page = await browser.newPage({ viewport:{ width:1080, height:1350 }, deviceScaleFactor:1 }); await inspectPage(page, html, count);
    const stagedSlides = join(stage, "slides"); mkdirSync(stagedSlides);
    for (let index = 0; index < count; index++) { const locator = page.locator(`#carousel > section.carousel-slide[data-slide="${index + 1}"]`), box = await locator.evaluate(element => { const { width,height } = element.getBoundingClientRect(); return { width,height }; }); if (box.width !== 1080 || box.height !== 1350) fail("RENDER_EXPORT", `slide ${index + 1} dimensions`); await locator.screenshot({ path:join(stagedSlides, `slide-${String(index + 1).padStart(2, "0")}.png`) }); }
    await browser.close(); browser = null; for (const name of paths(count)) { const size = pngSize(join(stage, name)); if (size.width !== 1080 || size.height !== 1350) fail("RENDER_EXPORT", "staged PNG dimensions"); }
    const stagedHtml = join(stage, "index.html"), stagedManifest = join(stage, "render-manifest.json"); writeFileSync(stagedHtml, html); writeFileSync(stagedManifest, `${JSON.stringify(manifestFor(basename(run), count), null, 2)}\n`);
    rmSync(join(run, "index.html"), { force:true }); rmSync(join(run, "slides"), { recursive:true, force:true }); renameSync(stagedHtml, join(run, "index.html")); renameSync(stagedSlides, join(run, "slides"));
    if (readFileSync(join(run, "index.html"), "utf8") !== assembleHtml(content, validateLayout(run, content), validateFragmentSet(run, content, validateLayout(run, content)).fragments)) fail("ASSEMBLY_FIDELITY", "published HTML mismatch");
    renameSync(stagedManifest, join(run, "render-manifest.json")); published = true; finishComposition(state, stateFile); return content;
  } catch (error) { restoreRenderer(run, state); logDiagnostic(run, { run, stage:"render", diagnostic:error.message }); throw error; }
  finally { if (browser) await browser.close(); if (existsSync(stage)) rmSync(stage, { recursive:true, force:true }); if (!published && state.backup && existsSync(state.backup)) rmSync(state.backup, { recursive:true, force:true }); }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , run, flag, stateFile] = process.argv;
  if (flag !== "--state-file" || !stateFile) { console.error("COMPOSER_RUN_OR_TEMPLATE arguments"); process.exitCode = 1; }
  else exportRun(run ?? "", { stateFile }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
