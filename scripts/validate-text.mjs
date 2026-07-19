export const HTML = /<!--[\s\S]*?-->|<![A-Za-z][^>]*>|<\?[\s\S]*?\?>|<\/?[A-Za-z][^>]*>|&(?:#\d+|#x[0-9A-Fa-f]+|[A-Za-z][A-Za-z0-9]+);/;
export const CSS = /[^{}\n]+\{[^{}\n]*\}|@[A-Za-z-]+(?:[^;{}]*[;{])/;
export const BLOCK_MARKDOWN = /^(?: {0,3}#{1,6}\s+.*| {0,3}>.*| {0,3}[-+*]\s+.*| {0,3}\d+[.)]\s+.*| {0,3}(?:```|~~~).*| {0,3}(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,}))$/m;
export const INLINE_MARKDOWN = /`[^`\n]+`|!?\[[^\]\n]*\]\([^\n)]*\)|(?:^|[\s\p{P}])(\*{1,3}|_{1,3})(?=\S)[\s\S]+?\1(?=$|[\s\p{P}])/u;

export function validateText(value, limit) {
  if (typeof value !== "string" || Array.from(value).length < 1) throw new Error("Invalid text length or type");
  if (HTML.test(value) || CSS.test(value) || BLOCK_MARKDOWN.test(value) || INLINE_MARKDOWN.test(value)) throw new Error("Text must be plain prose");
}
