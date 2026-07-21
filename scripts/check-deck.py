#!/usr/bin/env python3
"""Structural checker for deck.html. Read-only. Exits 0 on pass, 1 on failure."""
import sys, os, re
from html.parser import HTMLParser

VOID = {'br','hr','img','input','meta','link','area','base','col','embed','source','track','wbr'}

class P(HTMLParser):
    def __init__(s, info):
        super().__init__(); s.i = info; s.bd = -1; s.d = 0
        s.ss = False; s.sb = []; s.scr = False; s.td = 0
    def handle_starttag(s, tag, attrs):
        if tag not in VOID:
            s.d += 1
        if s.ss or s.scr: return
        if tag == 'style': s.ss = True; s.sb = []; s.td += 1; return
        if tag == 'script': s.scr = True; s.i['scr'].append(s.getpos()[0]); s.td += 1; return
        if tag == 'body': s.bd = s.d; s.td += 1; return
        if tag not in VOID: s.td += 1
        if s.bd > 0 and s.d == s.bd + 1:
            ad = dict(attrs)
            if tag == 'section' and ad.get('class') == 'slide':
                s.i['slides'].append(ad.get('style',''))
    def handle_endtag(s, tag):
        if tag not in VOID:
            s.d -= 1
            s.td -= 1
        if tag == 'style' and s.ss: s.ss = False; s.i['styles'].append(''.join(s.sb))
        elif tag == 'script' and s.scr: s.scr = False
    def handle_data(s, d):
        if s.ss: s.sb.append(d)

def dim_ok(slide_style, block):
    def has(w, h, t):
        return re.search(w, t, re.I) and re.search(h, t, re.I)
    if has(r'width\s*:\s*1080px', r'height\s*:\s*1350px', slide_style):
        return True
    return bool(block) and has(r'width\s*:\s*1080px', r'height\s*:\s*1350px', block)

def check(path):
    b = 0
    if not os.path.isfile(path):
        print(f'FILE: {path} not found'); return 1
    try:
        with open(path, encoding='utf-8') as f:
            raw = f.read()
    except (ValueError,OSError) as e:
        print(f'FILE: cannot read {path}: {e}'); return 1

    info = {'slides':[], 'styles':[], 'scr':[]}
    try:
        p = P(info); p.feed(raw); p.close()
    except Exception as e:
        print(f'PARSE: {e}'); return 1
    if p.td != 0:
        print(f'PARSE: unbalanced tags (depth {p.td})'); return 1

    slides = info['slides']
    cb = '\n'.join(info['styles'])

    if len(slides) != 10:
        print(f'SLIDE_COUNT: expected 10, found {len(slides)}'); b += 1

    for i, st in enumerate(slides):
        if not dim_ok(st, cb):
            print(f'DIMENSIONS: slide {i+1} missing or incorrect 1080x1350'); b += 1

    for m in re.finditer(r'href\s*=\s*["\x27](https?://(?!.*font)[^"\x27]*)', raw, re.I):
        print(f'EXTERNAL_URL: attribute="{m.group(1)}"'); b += 1
    for m in re.finditer(r'(?:src|poster|data)\s*=\s*["\x27](https?://[^"\x27]*)', raw, re.I):
        print(f'EXTERNAL_URL: attribute="{m.group(1)}"'); b += 1
    for m in re.finditer(r'url\(\s*["\x27]?(https?://(?!.*font)[^)"\x27]*)', raw, re.I):
        print(f'EXTERNAL_URL: url("{m.group(1)}")'); b += 1
    for m in re.finditer(r'@import\s+(?:url\()?\s*["\x27]?(https?://(?!.*font)[^)"\x27]*)', raw, re.I):
        print(f'EXTERNAL_URL: @import "{m.group(1)}"'); b += 1

    for m in re.finditer(r'<link[^>]*href\s*=\s*["\x27](https?://[^"\x27]*font[^"\x27]*)["\x27]', raw, re.I):
        print(f'EXTERNAL_FONT: <link> to {m.group(1)}'); b += 1
    for m in re.finditer(r'@font-face\s*\{[^}]*src\s*:\s*url\(\s*["\x27]?(https?://[^)"\x27]*)', raw, re.I):
        print(f'EXTERNAL_FONT: @font-face external src {m.group(1)}'); b += 1

    for ln in set(info['scr']):
        print(f'SCRIPT: <script> near line {ln}'); b += 1
    for attr in set(re.findall(r'\s(on\w+)\s*=\s*["\x27]', raw, re.I)):
        print(f'EVENT_HANDLER: {attr} attribute'); b += 1

    anim = {'animation','animation-name','animation-duration','animation-timing-function',
            'animation-delay','animation-iteration-count','animation-direction',
            'animation-fill-mode','animation-play-state','transition','transition-property',
            'transition-duration','transition-timing-function','transition-delay'}
    fa = set()
    for m in re.finditer(r'(animation\w*|transition\w*)\s*:', raw, re.I):
        pn = m.group(1).lower()
        if pn in anim and pn not in fa:
            fa.add(pn)
            ln = raw[:m.start()].count('\n')+1
            print(f'ANIMATION: {pn} near line {ln}'); b += 1
    for _ in re.finditer(r'@keyframes\b', raw, re.I):
        ln = raw[:_.start()].count('\n')+1
        if '@keyframes' not in fa:
            fa.add('@keyframes')
            print(f'ANIMATION: @keyframes near line {ln}'); b += 1

    return 1 if b else 0

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print('Usage: python scripts/check-deck.py <path>', file=sys.stderr)
        sys.exit(2)
    sys.exit(check(sys.argv[1]))
