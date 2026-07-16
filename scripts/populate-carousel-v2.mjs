import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateRunV2 } from "./validate-carousel-content-v2.mjs";

export const shellPath = new URL("../assets/database/carousel-v2-shell.html", import.meta.url);
const escape = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const template = (shell, variant) => shell.match(new RegExp(`<template data-variant="${variant}">([\\s\\S]*?)</template>`))?.[1] ?? (() => { throw new Error(`Invalid v2 shell variant: ${variant}`); })();
const glossary = entries => entries.map(({ term, definition }) => `<b class="glossary-term">${escape(term)}</b><span class="glossary-definition">${escape(definition)}</span>`).join("");
const listItems = entries => entries.map(({ label, detail }) => `<div class="list-item"><strong class="list-item-label">${escape(label)}</strong><span class="list-item-detail">${escape(detail)}</span></div>`).join("");
const comparisonSides = ({ left, right }) => [left, right].map(({ label, summary, items }) => `<section class="comparison-side"><h2 class="comparison-label">${escape(label)}</h2><p class="comparison-summary">${escape(summary)}</p><ul class="comparison-items">${items.map(item => `<li>${escape(item)}</li>`).join("")}</ul></section>`).join("");
const levelItems = entries => entries.map(({ label, value, description }) => `<div class="level"><strong class="level-label"><span>${escape(label)}</span><span>${escape(value)}%</span></strong><progress class="level-progress" value="${escape(value)}" max="100"></progress><small class="level-description">${escape(description)}</small></div>`).join("");

export function populateHtmlV2(content, shell = readFileSync(shellPath, "utf8")) {
  const count = String(content.slides.length).padStart(2, "0"), styles = shell.match(/<style>[\s\S]*?<\/style>/)?.[0] ?? (() => { throw new Error("Invalid v2 shell"); })();
  const slides = content.slides.map(slide => {
    const number = String(slide.number), padded = number.padStart(2, "0"), values = { number, header_number:padded, footer_number:padded, count_padded:count, header_topic:content.topic, footer_topic:content.topic, role:slide.role, title:slide.title, why:slide.why, prompt:slide.prompt, fact_value:slide.factValue, fact_label:slide.factLabel, quote:slide.quote, attribution:slide.attribution, glossary:glossary(slide.glossary), list_items:slide.items ? listItems(slide.items) : "", comparison_sides:slide.comparison ? comparisonSides(slide.comparison) : "", level_items:slide.levels ? levelItems(slide.levels) : "" };
    return template(shell, slide.variant).replace(/{{([a-z0-9_]+)}}/g, (_match, slot) => ["glossary", "list_items", "comparison_sides", "level_items"].includes(slot) ? values[slot] : escape(values[slot] ?? ""));
  }).join("\n");
  return `${styles}\n<main id="carousel">${slides}</main>\n`;
}

export function populateRunV2(runDirectory) { const content = validateRunV2(runDirectory), html = populateHtmlV2(content); writeFileSync(join(runDirectory, "index-v2.html"), html); return html; }
if (process.argv[1] === fileURLToPath(import.meta.url)) try { populateRunV2(process.argv[2] ?? ""); } catch (error) { console.error(`Populate failed: ${error.message}`); process.exitCode = 1; }
