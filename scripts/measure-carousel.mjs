const fail = (code, message) => { throw new Error(`${code}: ${message}`); };

export async function inspectPage(page, html, count) {
  let routed = false; await page.route("**/*", route => { routed = true; return route.abort(); }); await page.setContent(html, { waitUntil:"load" }); if (routed) fail("RENDER_EXPORT", "network route attempted");
  const result = await page.evaluate(async expected => {
    await document.fonts.ready;
    const roots = [...document.querySelectorAll("#carousel > section.carousel-slide[data-slide]")], slides = [...document.querySelectorAll("[data-slide]")].map(node => node.getAttribute("data-slide")), overflow = [], underfill = [];
    const elementPath = (host, node) => { const parts = []; for (let value = node; value && value !== host; value = value.parentElement) parts.unshift([...value.parentElement.children].indexOf(value)); return `/body/${parts.join("/")}`; };
    const clipped = (rect, box) => ({ left:Math.max(rect.left, box.left), top:Math.max(rect.top, box.top), right:Math.min(rect.right, box.right), bottom:Math.min(rect.bottom, box.bottom) });
    const visible = (node, host) => { for (let value = node; value; value = value.parentElement) { const style = getComputedStyle(value); if (style.display === "none" || ["hidden", "collapse"].includes(style.visibility) || style.contentVisibility === "hidden" || Number(style.opacity) === 0) return false; if (value === host) return true; } return false; };
    roots.forEach((root, index) => {
      const number = index + 1, rootRect = root.getBoundingClientRect(), hosts = root.querySelectorAll(".slide-body"), problems = [];
      if (hosts.length !== 1) { overflow.push(`BODY_OVERFLOW slide ${number} /body: expected one reserved body`); return; }
      const host = hosts[0], hostRect = host.getBoundingClientRect(), hostStyle = getComputedStyle(host), contentBox = { left:hostRect.left + parseFloat(hostStyle.borderLeftWidth) + parseFloat(hostStyle.paddingLeft), top:hostRect.top + parseFloat(hostStyle.borderTopWidth) + parseFloat(hostStyle.paddingTop), right:hostRect.right - parseFloat(hostStyle.borderRightWidth) - parseFloat(hostStyle.paddingRight), bottom:hostRect.bottom - parseFloat(hostStyle.borderBottomWidth) - parseFloat(hostStyle.paddingBottom) }, candidates = [];
      const hostOverflow = host.scrollWidth > host.clientWidth || host.scrollHeight > host.clientHeight; if (hostRect.width <= 0 || hostRect.height <= 0) problems.push(`BODY_OVERFLOW slide ${number} /body: reserved body has no positive area`);
      [host, ...host.querySelectorAll("*")].forEach(node => {
        const style = getComputedStyle(node), svg = node instanceof SVGElement, path = node === host ? "/body" : elementPath(host, node);
        if (!svg) for (const property of ["overflow", "overflowX", "overflowY"]) if (["hidden", "clip"].includes(style[property])) problems.push(`BODY_OVERFLOW slide ${number} ${path}: prohibited ${property}`);
        if (["fixed", "sticky"].includes(style.position) || style.display === "none" || ["hidden", "collapse"].includes(style.visibility) || style.contentVisibility === "hidden" || Number(style.opacity) === 0 || style.clipPath !== "none" || style.maskImage !== "none" || style.filter !== "none") problems.push(`BODY_OVERFLOW slide ${number} ${path}: hidden, clipped, or escaped content`);
        if (node === host) return;
        for (const rect of node.getClientRects()) for (const [edge, actual, bound, low] of [["left",rect.left,hostRect.left,true],["top",rect.top,hostRect.top,true],["right",rect.right,hostRect.right,false],["bottom",rect.bottom,hostRect.bottom,false]]) if (low ? actual < bound - .5 : actual > bound + .5) problems.push(`BODY_OVERFLOW slide ${number} ${path}: crossed ${edge}`);
      });
      const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT); let textNode; const textIndexes = new Map();
      while ((textNode = walker.nextNode())) if (/\S/u.test(textNode.nodeValue)) {
        const parent = textNode.parentElement, textIndex = textIndexes.get(parent) ?? 0, path = `${elementPath(host, parent)}:text(${textIndex})`; textIndexes.set(parent, textIndex + 1);
        const range = document.createRange(); range.selectNodeContents(textNode); const rects = [...range.getClientRects()].filter(rect => rect.width > 0 && rect.height > 0), style = getComputedStyle(parent), color = style.color.match(/[\d.]+/g)?.map(Number) ?? [], textVisible = visible(parent, host) && Number.parseFloat(style.fontSize) > 0 && Number.parseFloat(style.lineHeight) > 0 && !(color.length === 4 && color[3] === 0);
        if (!rects.length || !textVisible) problems.push(`BODY_OVERFLOW slide ${number} ${path}: invisible text`);
        for (const rect of rects) { for (const [edge, actual, bound, low] of [["left",rect.left,hostRect.left,true],["top",rect.top,hostRect.top,true],["right",rect.right,hostRect.right,false],["bottom",rect.bottom,hostRect.bottom,false]]) if (low ? actual < bound - .5 : actual > bound + .5) problems.push(`BODY_OVERFLOW slide ${number} ${path}: crossed ${edge}`); if (textVisible) { const box = clipped(rect, contentBox); if (box.right > box.left && box.bottom > box.top) candidates.push(box); } }
      }
      host.querySelectorAll("line,polyline,polygon,rect,circle,ellipse").forEach(node => { const box = node.getBBox(), style = getComputedStyle(node), fill = style.fill !== "none" && Number(style.fillOpacity) * Number(style.opacity) > 0, stroke = style.stroke !== "none" && Number(style.strokeOpacity) * Number(style.opacity) > 0 && Number.parseFloat(style.strokeWidth) > 0; if (!(box.width > 0 || box.height > 0) || !fill && !stroke) problems.push(`BODY_OVERFLOW slide ${number} ${elementPath(host, node)}: invisible SVG geometry`); else if (visible(node, host)) for (const rect of node.getClientRects()) { const clippedRect = clipped(rect, contentBox); if (clippedRect.right > clippedRect.left && clippedRect.bottom > clippedRect.top) candidates.push(clippedRect); } });
      if (hostOverflow) problems.push(`BODY_OVERFLOW slide ${number} /body: reserved body overflow`);
      [root, ...root.querySelectorAll("*")].forEach(node => { const style = getComputedStyle(node), rect = node.getBoundingClientRect(), path = node === root ? "/slide" : elementPath(root, node).replace("/body", "/slide"); if (node.scrollWidth > Math.ceil(rect.width) || node.scrollHeight > Math.ceil(rect.height)) problems.push(`RENDER_EXPORT slide ${number} ${path}: ${node.tagName.toLowerCase()} overflowed (${node.scrollWidth}x${node.scrollHeight} > ${Math.ceil(rect.width)}x${Math.ceil(rect.height)})`); if (node !== root && style.display !== "none" && style.visibility !== "hidden") for (const [actual,bound,low] of [[rect.left,rootRect.left,true],[rect.top,rootRect.top,true],[rect.right,rootRect.right,false],[rect.bottom,rootRect.bottom,false]]) if (low ? actual < bound : actual > bound) problems.push(`RENDER_EXPORT slide ${number} ${path}: descendant escaped slide`); });
      overflow.push(...problems);
      // const ratio = candidates.length ? (Math.max(...candidates.map(rect => rect.bottom)) - Math.min(...candidates.map(rect => rect.top))) / (contentBox.bottom - contentBox.top) : 0;
      // if (ratio < .70) underfill.push(`BODY_UNDERFILL slide ${number} /body: qualifying span ${ratio}`);
    });
    return { roots:roots.length, slides, violations:[...overflow, ...underfill], expected };
  }, count);
  if (result.roots !== count || result.slides.join() !== Array.from({ length:count }, (_, index) => String(index + 1)).join()) fail("RENDER_EXPORT", "invalid slide identity");
  if (result.violations.length) throw new Error(result.violations.join("\n"));
}

export async function inspectDom(html, count, { chromium } = {}) {
  if (!chromium) ({ chromium } = await import("playwright")); let browser;
  try { browser = await chromium.launch(); const page = await browser.newPage({ viewport:{ width:1080, height:1350 }, deviceScaleFactor:1 }); await inspectPage(page, html, count); }
  finally { if (browser) await browser.close(); }
}
