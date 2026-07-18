import { appendFileSync, cpSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { assertRunDirectory, loadArchive, snapshotBoundary, snapshotChanged, validateLayout } from "./validate-carousel-layout.mjs";
import { validateRun } from "./validate-carousel-content.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const fail = (code, path, message = "validation failed") => { throw new Error(`${code} ${path}: ${message}`); };
const stat = path => { try { return lstatSync(path); } catch { return null; } };
const regular = path => { const value = stat(path); return value?.isFile() && !value.isSymbolicLink(); };
const directory = path => { const value = stat(path); return value?.isDirectory() && !value.isSymbolicLink(); };
const escape = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const htmlTags = new Set(["section", "div", "article", "figure", "figcaption", "p", "h2", "h3", "span", "strong", "em", "code", "pre", "ul", "ol", "li", "blockquote"]);
const svgTags = new Set(["svg", "g", "line", "polyline", "polygon", "rect", "circle", "ellipse"]);
const geometry = new Set(["line", "polyline", "polygon", "rect", "circle", "ellipse"]);
const reservedClasses = new Set(["carousel-slide", "slide-content", "masthead", "brand", "section-label", "content", "tag", "why", "why-label", "slide-body", "glossary", "glossary-term", "glossary-definition", "footer"]);
const resourceTokens = /url|javascript|vbscript|data:|@import|expression|behavior|-moz-binding/i;
const unsignedNumber = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
const integerNumber = /^(?:0|-?[1-9]\d*)$/;
const color = /^(?:#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6}|currentcolor)$/;

const positiveNumber = value => unsignedNumber.test(value) && Number(value) > 0;
const unsignedLength = value => value === "0" || /^(?:0|[1-9]\d*)(?:\.\d+)?(?:px|em|rem|%)$/.test(value) && Number.parseFloat(value) > 0;
const positiveLength = value => /^(?:0|[1-9]\d*)(?:\.\d+)?(?:px|em|rem|%)$/.test(value) && Number.parseFloat(value) > 0;
const signedLength = value => unsignedLength(value) || /^-(?:0|[1-9]\d*)(?:\.\d+)?(?:px|em|rem|%)$/.test(value) && Number.parseFloat(value.slice(1)) > 0;
const list = (value, minimum, maximum, validate) => { const parts = value.split(" "); return parts.length >= minimum && parts.length <= maximum && parts.every(validate); };
const oneOf = (...values) => value => values.includes(value);

function validateStyle(source, path) {
  if (!source || source !== source.trim() || /[\t\n\r\\{}]|\/\*|\*\/|--|\bvar\b/i.test(source) || resourceTokens.test(source)) fail("FRAGMENT_STYLE", path, "unsafe style syntax");
  const declarations = source.endsWith(";") ? source.slice(0, -1).split(";") : source.split(";");
  if (declarations.some(value => !value)) fail("FRAGMENT_STYLE", path, "empty declaration");
  const styles = {};
  const display = oneOf("block", "inline", "inline-block", "grid", "flex", "inline-grid", "inline-flex"), position = oneOf("static", "relative", "absolute");
  const alignment = oneOf("normal", "start", "end", "center", "space-between", "space-around", "space-evenly", "stretch"), itemAlignment = oneOf("auto", "normal", "start", "end", "center", "stretch");
  const borderStyle = oneOf("none", "solid", "dashed", "dotted"), track = value => unsignedLength(value) || positiveNumber(value.slice(0, -2)) && value.endsWith("fr") || ["auto", "min-content", "max-content"].includes(value);
  for (const declaration of declarations) {
    const match = /^([a-z][a-z-]*) *: *(.+?)$/.exec(declaration); if (!match || match[2] !== match[2].trim() || match[2].includes(":")) fail("FRAGMENT_STYLE", path, "malformed declaration");
    const [, property, value] = match; if (Object.hasOwn(styles, property)) fail("FRAGMENT_STYLE", path, `duplicate ${property}`);
    let valid = false;
    if (property === "display") valid = display(value);
    else if (property === "position") valid = position(value);
    else if (["grid-template-columns", "grid-template-rows"].includes(property)) valid = list(value, 1, 12, track);
    else if (["grid-column", "grid-row"].includes(property)) valid = value === "auto" || /^[1-9]\d*$/.test(value) || /^span [1-9]\d*$/.test(value);
    else if (property === "grid-auto-flow") valid = ["row", "column", "dense", "row dense", "column dense"].includes(value);
    else if (property === "flex-direction") valid = ["row", "row-reverse", "column", "column-reverse"].includes(value);
    else if (property === "flex-wrap") valid = ["nowrap", "wrap", "wrap-reverse"].includes(value);
    else if (["flex-grow", "flex-shrink"].includes(property)) valid = unsignedNumber.test(value);
    else if (property === "flex-basis") valid = value === "auto" || unsignedLength(value);
    else if (property === "order") valid = integerNumber.test(value);
    else if (["justify-content", "align-content"].includes(property)) valid = alignment(value);
    else if (["justify-items", "align-items", "justify-self", "align-self"].includes(property)) valid = itemAlignment(value);
    else if (["gap", "row-gap", "column-gap"].includes(property)) valid = list(value, 1, property === "gap" ? 2 : 1, unsignedLength);
    else if (property === "box-sizing") valid = ["content-box", "border-box"].includes(value);
    else if (["width", "height", "min-width", "min-height"].includes(property)) valid = value === "auto" || unsignedLength(value);
    else if (["max-width", "max-height"].includes(property)) valid = value === "none" || unsignedLength(value);
    else if (["top", "right", "bottom", "left"].includes(property)) valid = value === "auto" || signedLength(value);
    else if (property === "inset") valid = list(value, 1, 4, part => part === "auto" || signedLength(part));
    else if (["margin-top", "margin-right", "margin-bottom", "margin-left"].includes(property)) valid = value === "auto" || signedLength(value);
    else if (property === "margin") valid = list(value, 1, 4, part => part === "auto" || signedLength(part));
    else if (["padding-top", "padding-right", "padding-bottom", "padding-left"].includes(property)) valid = unsignedLength(value);
    else if (property === "padding") valid = list(value, 1, 4, unsignedLength);
    else if (property === "font-family") { const names = value.split(","); valid = names.length <= 4 && names.every(part => /^ *'[A-Za-z][A-Za-z0-9 -]{0,63}' *$/.test(part)); }
    else if (property === "font-size") valid = positiveLength(value);
    else if (property === "font-weight") valid = ["normal", "bold", "100", "200", "300", "400", "500", "600", "700", "800", "900"].includes(value);
    else if (property === "font-style") valid = ["normal", "italic"].includes(value);
    else if (property === "line-height") valid = value === "normal" || positiveNumber(value) || positiveLength(value);
    else if (property === "letter-spacing") valid = value === "normal" || signedLength(value);
    else if (property === "text-align") valid = ["start", "end", "left", "right", "center"].includes(value);
    else if (property === "text-transform") valid = ["none", "uppercase", "lowercase", "capitalize"].includes(value);
    else if (property === "text-decoration") valid = ["none", "underline", "line-through"].includes(value);
    else if (property === "white-space") valid = ["normal", "nowrap", "pre", "pre-wrap", "pre-line", "break-spaces"].includes(value);
    else if (property === "overflow-wrap") valid = ["normal", "break-word", "anywhere"].includes(value);
    else if (property === "word-break") valid = ["normal", "break-all", "keep-all"].includes(value);
    else if (["color", "background-color"].includes(property)) valid = color.test(value);
    else if (property === "border-width") valid = list(value, 1, 4, part => part === "0" || /^(?:0|[1-9]\d*)(?:\.\d+)?px$/.test(part));
    else if (/^border-(?:top|right|bottom|left)-width$/.test(property)) valid = value === "0" || /^(?:0|[1-9]\d*)(?:\.\d+)?px$/.test(value);
    else if (property === "border-style") valid = list(value, 1, 4, borderStyle);
    else if (/^border-(?:top|right|bottom|left)-style$/.test(property)) valid = borderStyle(value);
    else if (property === "border-color") valid = list(value, 1, 4, part => color.test(part));
    else if (/^border-(?:top|right|bottom|left)-color$/.test(property)) valid = color.test(value);
    else if (property === "border-radius") valid = list(value, 1, 4, unsignedLength);
    else if (["fill", "stroke"].includes(property)) valid = value === "none" || color.test(value);
    else if (property === "stroke-width") valid = positiveNumber(value) || positiveLength(value);
    else if (property === "stroke-linecap") valid = ["butt", "round", "square"].includes(value);
    else if (property === "stroke-linejoin") valid = ["miter", "round", "bevel"].includes(value);
    if (!valid || /fixed|sticky|transparent/i.test(value)) fail("FRAGMENT_STYLE", path, `${property}: ${value}`);
    styles[property] = value;
  }
  return styles;
}

function attrs(source, path) {
  const values = {}; let offset = 0; const pattern = /[\t\n\r ]+([A-Za-z][A-Za-z0-9:-]*|data-[a-z-]+)="([^"<>&]*)"/y;
  while (offset < source.length) { pattern.lastIndex = offset; const match = pattern.exec(source); if (!match) fail("FRAGMENT_SYNTAX", path, "malformed attribute syntax"); if (Object.hasOwn(values, match[1])) fail("FRAGMENT_ATTRIBUTE", path, `duplicate ${match[1]}`); values[match[1]] = match[2]; offset = pattern.lastIndex; }
  return values;
}

export function parseFragment(source, path = "fragment") {
  if (source.startsWith("\uFEFF") || /[\0\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(source) || /<!--|<!|<\?|\/>/.test(source)) fail("FRAGMENT_SYNTAX", path, "prohibited source token");
  const roots = [], stack = []; let offset = 0;
  while (offset < source.length) {
    if (source[offset] !== "<") {
      const end = source.indexOf("<", offset), text = source.slice(offset, end < 0 ? source.length : end); offset += text.length;
      if (!stack.length) { if (/[^\t\n\r ]/.test(text)) fail("FRAGMENT_SYNTAX", path, "top-level text"); continue; }
      if (svgTags.has(stack.at(-1).tag)) fail("FRAGMENT_SVG", path, "SVG text");
      validateEntities(text, path); stack.at(-1).children.push({ text, parent:stack.at(-1) }); continue;
    }
    const close = /^<\/([a-z][a-z0-9]*)>/.exec(source.slice(offset));
    if (close) { const node = stack.pop(); if (!node || node.tag !== close[1]) fail("FRAGMENT_SYNTAX", path, "malformed nesting"); offset += close[0].length; continue; }
    const open = /^<([a-z][a-z0-9]*)((?:[\t\n\r ]+[A-Za-z][A-Za-z0-9:-]*="[^"<>&]*")*)[\t\n\r ]*>/.exec(source.slice(offset));
    if (!open) fail("FRAGMENT_SYNTAX", path, "raw text or malformed tag");
    const node = { tag: open[1], attrs: attrs(open[2], path), children: [], parent: stack.at(-1) ?? null };
    if (!htmlTags.has(node.tag) && !svgTags.has(node.tag)) fail("FRAGMENT_TAG", path, node.tag);
    if (node.parent) node.parent.children.push(node); else roots.push(node);
    stack.push(node); offset += open[0].length;
  }
  if (stack.length || !roots.length) fail("FRAGMENT_SYNTAX", path, "fragment needs explicitly closed roots");
  return roots;
}

function validateEntities(source, path) {
  for (let offset = 0; offset < source.length;) {
    const index = source.indexOf("&", offset); if (index < 0) break;
    const match = /^&(?:amp|lt|gt|quot|apos|nbsp|#39|#[0-9]+|#x[0-9A-Fa-f]+);/.exec(source.slice(index)); if (!match) fail("FRAGMENT_SYNTAX", path, "invalid entity");
    if (match[0][1] === "#") { const body = match[0].slice(2, -1), point = Number.parseInt(body[0] === "x" ? body.slice(1) : body, body[0] === "x" ? 16 : 10); if (!Number.isInteger(point) || point > 0x10ffff || point >= 0xd800 && point <= 0xdfff || point === 0 || point <= 0x1f && ![9, 10, 13].includes(point) || point >= 0x7f && point <= 0x9f) fail("FRAGMENT_SYNTAX", path, "invalid entity scalar"); }
    offset = index + match[0].length;
  }
}
function decoded(source) { return source.replace(/&(?:amp|lt|gt|quot|apos|nbsp|#39|#[0-9]+|#x[0-9A-Fa-f]+);/g, entity => entity === "&amp;" ? "&" : entity === "&lt;" ? "<" : entity === "&gt;" ? ">" : ["&quot;", "&apos;", "&#39;"].includes(entity) ? entity === "&quot;" ? '"' : "'" : entity === "&nbsp;" ? "\u00a0" : String.fromCodePoint(Number.parseInt(entity.slice(2, -1).replace(/^x/, ""), entity[2] === "x" ? 16 : 10))); }
function walk(node, visit) { if (node.tag) visit(node); node.children?.forEach(child => walk(child, visit)); }
const elementChildren = node => node.children.filter(child => child.tag);
const classes = node => node.attrs.class?.trim().split(/[\t\n\r ]+/) ?? [];
const pClosers = new Set(["section", "div", "article", "figure", "figcaption", "blockquote", "p", "h2", "h3", "pre", "ul", "ol", "li"]);
const headings = new Set(["h2", "h3"]);
function validateParents(node, path, ancestors = []) {
  const parent = node.parent?.tag;
  if (node.tag === "svg") { if (parent && !htmlTags.has(parent)) fail("FRAGMENT_TAG", path, "svg must be top-level or inside HTML"); }
  else if (node.tag === "g") { if (parent !== "svg") fail("FRAGMENT_TAG", path, "g must be inside svg"); }
  else if (geometry.has(node.tag)) { if (!["svg", "g"].includes(parent)) fail("FRAGMENT_TAG", path, "geometry must be inside svg or g"); }
  else if (svgTags.has(parent)) fail("FRAGMENT_TAG", path, "HTML cannot be inside SVG");
  if (geometry.has(node.tag) && elementChildren(node).length) fail("FRAGMENT_TAG", path, "geometry must be empty");
  if (ancestors.includes("p") && pClosers.has(node.tag) || headings.has(node.tag) && ancestors.some(tag => headings.has(tag)) || node.tag === "li" && ancestors.includes("li")) fail("FRAGMENT_SYNTAX", path, "browser would repair nesting");
  for (const child of elementChildren(node)) {
    if (node.tag === "svg" && child.tag !== "g" && !geometry.has(child.tag) || node.tag === "g" && !geometry.has(child.tag)) fail("FRAGMENT_TAG", path, `${child.tag} cannot be inside ${node.tag}`);
    validateParents(child, path, [...ancestors, node.tag]);
  }
}

function validateAttributes(node, path) {
  const names = Object.keys(node.attrs), svg = svgTags.has(node.tag);
  if (!svg) {
    if (names.some(name => !["class", "style"].includes(name))) fail("FRAGMENT_ATTRIBUTE", path, names.find(name => !["class", "style"].includes(name)));
  } else {
    const allowed = { svg:["class", "style", "viewBox", "preserveAspectRatio", "aria-hidden", "focusable"], g:["class", "style"], line:["class", "style", "x1", "y1", "x2", "y2"], polyline:["class", "style", "points"], polygon:["class", "style", "points"], rect:["class", "style", "x", "y", "width", "height", "rx", "ry"], circle:["class", "style", "cx", "cy", "r"], ellipse:["class", "style", "cx", "cy", "rx", "ry"] }[node.tag];
    if (names.some(name => !allowed.includes(name))) fail("FRAGMENT_ATTRIBUTE", path, names.find(name => !allowed.includes(name)));
  }
  if (Object.hasOwn(node.attrs, "class")) validateClasses(node, path);
  if (Object.hasOwn(node.attrs, "style")) node.style = validateStyle(node.attrs.style, path);
}

function validateClasses(node, path) {
  const source = node.attrs.class, tokens = classes(node); if (!source.trim() || new Set(tokens).size !== tokens.length || tokens.some(token => !/^[A-Za-z_][A-Za-z0-9_-]*$/.test(token) || token.startsWith("cp-") || reservedClasses.has(token))) fail("FRAGMENT_CLASS", path, "invalid, duplicate, legacy, or reserved class");
}
const integer = value => /^(?:0|[1-9]\d*)$/.test(value ?? "") ? Number(value) : NaN;
function validateSvg(node, path) {
  const svgNodes = []; walk(node, child => { if (svgTags.has(child.tag)) svgNodes.push(child); });
  if (svgNodes.length > 128) fail("FRAGMENT_SVG", path, "too many SVG elements");
  for (const value of svgNodes) {
    if (value.tag === "svg") {
      const exact = { viewBox:"0 0 1000 600", preserveAspectRatio:"xMidYMid meet", "aria-hidden":"true", focusable:"false" }, names = Object.keys(value.attrs).filter(name => !["class", "style"].includes(name));
      if (names.length !== 4 || Object.entries(exact).some(([key, expected]) => value.attrs[key] !== expected) || !elementChildren(value).some(child => geometry.has(child.tag) || child.tag === "g" && elementChildren(child).some(grandchild => geometry.has(grandchild.tag)))) fail("FRAGMENT_SVG", path, "invalid SVG root");
      continue;
    }
    if (value.tag === "g") continue;
    const number = key => integer(value.attrs[key]);
    const required = { line:["x1", "y1", "x2", "y2"], polyline:["points"], polygon:["points"], rect:["x", "y", "width", "height"], circle:["cx", "cy", "r"], ellipse:["cx", "cy", "rx", "ry"] }[value.tag]; if (required.some(name => !Object.hasOwn(value.attrs, name))) fail("FRAGMENT_SVG", path, "missing geometry attribute");
    if (value.tag === "line") { const points = [number("x1"), number("y1"), number("x2"), number("y2")]; if (points.some(Number.isNaN) || points[0] > 1000 || points[2] > 1000 || points[1] > 600 || points[3] > 600 || points[0] === points[2] && points[1] === points[3]) fail("FRAGMENT_SVG", path, "line bounds"); }
    if (["polyline", "polygon"].includes(value.tag)) { const points = value.attrs.points?.split(" ") ?? []; if (points.length < 2 || points.length > 64 || points.some(pair => { const match = /^(0|[1-9]\d*),(0|[1-9]\d*)$/.exec(pair); return !match || Number(match[1]) > 1000 || Number(match[2]) > 600; })) fail("FRAGMENT_SVG", path, "point bounds"); }
    if (value.tag === "rect") { const [x,y,width,height,rx=0,ry=0] = [number("x"),number("y"),number("width"),number("height"),value.attrs.rx === undefined ? 0 : number("rx"),value.attrs.ry === undefined ? 0 : number("ry")]; if ([x,y,width,height,rx,ry].some(Number.isNaN) || width <= 0 || height <= 0 || x + width > 1000 || y + height > 600 || rx > width / 2 || ry > height / 2) fail("FRAGMENT_SVG", path, "rect bounds"); }
    if (value.tag === "circle") { const [cx,cy,r] = [number("cx"),number("cy"),number("r")]; if ([cx,cy,r].some(Number.isNaN) || r <= 0 || cx-r < 0 || cx+r > 1000 || cy-r < 0 || cy+r > 600) fail("FRAGMENT_SVG", path, "circle bounds"); }
    if (value.tag === "ellipse") { const [cx,cy,rx,ry] = [number("cx"),number("cy"),number("rx"),number("ry")]; if ([cx,cy,rx,ry].some(Number.isNaN) || rx <= 0 || ry <= 0 || cx-rx < 0 || cx+rx > 1000 || cy-ry < 0 || cy+ry > 600) fail("FRAGMENT_SVG", path, "ellipse bounds"); }
  }
}
function validateFragment(roots, path) {
  let substantive = false, paintedGeometry = false, svgCount = 0;
  for (const rootNode of roots) {
    validateParents(rootNode, path); walk(rootNode, node => {
      validateAttributes(node, path); if (svgTags.has(node.tag)) svgCount++;
      if (geometry.has(node.tag)) {
        const inherited = property => { for (let value = node; value; value = value.parent) if (value.style?.[property] !== undefined) return value.style[property]; }, fill = inherited("fill"), stroke = inherited("stroke"), width = inherited("stroke-width"), pointArea = () => { const points = node.attrs.points?.split(" ").map(pair => pair.split(",").map(Number)) ?? []; return points.length >= 3 && Math.abs(points.reduce((sum, [x, y], index) => { const [nextX, nextY] = points[(index + 1) % points.length]; return sum + x * nextY - nextX * y; }, 0)) > 0; }, fillVisible = node.tag !== "line" && fill !== "none" && (!["polyline", "polygon"].includes(node.tag) || pointArea()), strokeVisible = stroke && stroke !== "none" && (!width || positiveNumber(width) || positiveLength(width));
        if (fillVisible || strokeVisible) paintedGeometry = true;
      }
    }); validateSvg(rootNode, path);
    const text = []; walk(rootNode, node => node.children.filter(child => !child.tag).forEach(child => text.push(child.text))); if (text.some(value => /\S/u.test(decoded(value)))) substantive = true;
  }
  if (svgCount > 128) fail("FRAGMENT_SVG", path, "too many SVG elements");
  if (!substantive && !paintedGeometry) fail("FRAGMENT_SVG", path, "fragment has no substantive visible content");
  return { roots };
}

export function validateFragmentSet(run, content) {
  const bodies = join(run, "slide-bodies"); if (!directory(bodies)) fail("COMPOSER_OUTPUT_SET", bodies, "real directory required");
  const expected = content.slides.map(slide => `${String(slide.number).padStart(2, "0")}.html`), members = readdirSync(bodies).sort();
  if (members.join() !== expected.join()) fail("COMPOSER_OUTPUT_SET", bodies, "exact numbered output set required");
  const fragments = [];
  for (let index = 0; index < expected.length; index++) {
    const path = join(bodies, expected[index]), value = stat(path); if (!value?.isFile() || value.isSymbolicLink()) fail("COMPOSER_OUTPUT_SET", path, "real regular file required");
    const bytes = readFileSync(path); if (bytes.length > 65536) fail("FRAGMENT_BYTES", path, "64 KiB limit");
    if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf || bytes.includes(0)) fail("FRAGMENT_BYTES", path, "BOM or NUL");
    let source; try { source = new TextDecoder("utf-8", { fatal:true }).decode(bytes); } catch { fail("FRAGMENT_BYTES", path, "invalid UTF-8"); }
    fragments.push(validateFragment(parseFragment(source, path), path));
  }
  return { fragments };
}

function serialize(node) {
  if (!node.tag) return node.text;
  const attributes = Object.entries(node.attrs).map(([name, value]) => ` ${name}="${value}"`).join("");
  return `<${node.tag}${attributes}>${node.children.map(serialize).join("")}</${node.tag}>`;
}
const glossary = entries => entries.map(({ term, definition }) => `<b class="glossary-term">${escape(term)}</b><span class="glossary-definition">${escape(definition)}</span>`).join("");
export function assembleHtml(content, fragments, shell = readFileSync(new URL("../assets/database/carousel-shell.html", import.meta.url), "utf8"), theme = readFileSync(new URL("../assets/database/theme.css", import.meta.url), "utf8")) {
  const withTheme = shell.replace("{{theme_css}}", theme), template = withTheme.match(/<template data-shell="database-blueprint">([\s\S]*?)<\/template>/)?.[1]; if (!template || withTheme.match(/<template\b/g)?.length !== 1) fail("ASSEMBLY_OUTPUT", "shell", "one canonical shell required");
  const count = String(content.slides.length).padStart(2, "0"), slides = content.slides.map((slide, index) => {
    const padded = String(slide.number).padStart(2, "0"), values = { number:String(slide.number), header_topic:content.topic, header_number:padded, role:slide.role, title:slide.title, why:slide.why, body:fragments[index].roots.map(serialize).join(""), glossary:glossary(slide.glossary), footer_topic:content.topic, footer_number:padded, count_padded:count };
    return template.replace(/{{([a-z_]+)}}/g, (_match, slot) => ["body", "glossary"].includes(slot) ? values[slot] : escape(values[slot] ?? fail("ASSEMBLY_OUTPUT", slot, "unknown slot")));
  }).join("\n");
  const html = `${withTheme.match(/<style>[\s\S]*?<\/style>/)?.[0]}\n<main id="carousel">${slides}</main>\n`;
  if (/{{/.test(html)) fail("ASSEMBLY_OUTPUT", "index.html", "unbound slot");
  return html;
}

function statePath(run, path) { const file = resolve(path ?? ""), outside = relative(resolve(run), file); if (!outside || (!outside.startsWith("..") && outside !== "..")) fail("COMPOSER_RUN_OR_TEMPLATE", file, "state must be outside run"); return file; }
function rendererMembers(run) { return ["slide-bodies", "index.html", "slides", "render-manifest.json"].map(name => join(run, name)); }
function completeRenderer(run) { const members = rendererMembers(run), manifest = stat(members[3]); if (!manifest) return false; if (manifest.isSymbolicLink() || !manifest.isFile() || !directory(members[0]) || !regular(members[1]) || !directory(members[2])) fail("COMPOSER_RUN_OR_TEMPLATE", run, "prior success marker has an incomplete renderer set"); return true; }
function filteredBoundary(run) { const prefix = `${relative(root, join(run, "slide-bodies"))}/`; return snapshotBoundary(run).filter(entry => !entry[0].startsWith(prefix)); }
export function restoreRenderer(run, state) {
  for (const path of rendererMembers(run)) rmSync(path, { recursive:true, force:true });
  if (state.backup) for (const name of ["slide-bodies", "index.html", "slides", "render-manifest.json"]) cpSync(join(state.backup, name), join(run, name), { recursive:true });
}
export function readCompositionState(run, file) { const path = statePath(run, file); if (!regular(path)) fail("COMPOSER_RUN_OR_TEMPLATE", path, "missing state"); try { const value = JSON.parse(readFileSync(path, "utf8")); if (!Array.isArray(value.boundary) || (value.backup !== null && typeof value.backup !== "string")) throw Error(); return value; } catch { fail("COMPOSER_RUN_OR_TEMPLATE", path, "invalid state"); } }
export function prepareComposition(runDirectory, file) {
  const run = assertRunDirectory(runDirectory), stateFile = statePath(run, file), content = validateRun(run); validateLayout(run, content); loadArchive();
  const shell = readFileSync(new URL("../assets/database/carousel-shell.html", import.meta.url), "utf8"); if (!shell.includes('<template data-shell="database-blueprint">') || (shell.match(/{{body}}/g) ?? []).length !== 1) fail("COMPOSER_RUN_OR_TEMPLATE", "carousel-shell.html", "invalid canonical shell");
  const body = join(run, "slide-bodies"), bodyStat = stat(body); if (bodyStat?.isSymbolicLink() || (bodyStat && !bodyStat.isDirectory())) fail("COMPOSER_STALE_OUTPUT", body, "unsafe body path");
  const backup = completeRenderer(run) ? mkdtempSync(join(tmpdir(), "apollo-render-backup-")) : null;
  try {
    if (backup) for (const name of ["slide-bodies", "index.html", "slides", "render-manifest.json"]) cpSync(join(run, name), join(backup, name), { recursive:true });
    rmSync(join(run, "render-manifest.json"), { force:true }); rmSync(body, { recursive:true, force:true }); mkdirSync(body);
    const state = { backup, boundary:filteredBoundary(run) }; writeFileSync(stateFile, JSON.stringify(state)); return state;
  } catch (error) { const state = { backup, boundary:[] }; restoreRenderer(run, state); if (backup) rmSync(backup, { recursive:true, force:true }); throw error; }
}
export function validateComposition(runDirectory, state) {
  const run = assertRunDirectory(runDirectory), after = filteredBoundary(run); if (snapshotChanged(state.boundary, after)) fail("COMPOSER_PROTECTED_MUTATION", run);
  const content = validateRun(run), layout = validateLayout(run, content), result = validateFragmentSet(run, content); return { content, layout, ...result, html:assembleHtml(content, result.fragments) };
}
export function checkComposition(runDirectory) {
  const run = assertRunDirectory(runDirectory), content = validateRun(run); validateLayout(run, content); validateFragmentSet(run, content);
}
export function finishComposition(state, file) { if (state.backup) rmSync(state.backup, { recursive:true, force:true }); if (file) rmSync(file, { force:true }); }
export function logDiagnostic(run, record) { try { appendFileSync(join(dirname(dirname(resolve(run))), "proof-log.jsonl"), `${JSON.stringify(record)}\n`); } catch {} }

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , run, mode, flag, file] = process.argv;
  try {
    if (mode === "--check" && flag === undefined) checkComposition(run);
    else if (mode === "--prepare" && flag === "--state-file" && file) prepareComposition(run, file);
    else if (mode === "--restore" && flag === "--state-file" && file) { const state = readCompositionState(run, file); restoreRenderer(resolve(run), state); finishComposition(state, file); }
    else throw Error("COMPOSER_RUN_OR_TEMPLATE arguments");
  } catch (error) { if (mode !== "--check") logDiagnostic(run, { run:resolve(run ?? ""), stage:"composer", diagnostic:error.message }); console.error(error.message); process.exitCode = 1; }
}
