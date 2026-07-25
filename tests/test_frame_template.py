"""Tests for the frame template contract (spec 0003). Stdlib-only, matching test_check_deck.py style."""

import os
import re
import subprocess
import sys
import tempfile

PROJECT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE = os.path.join(PROJECT, "templates", "frame.html")
CHECK_DECK = os.path.join(PROJECT, "scripts", "check-deck.py")

def _read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()

def _build_deck(slide_count=10):
    """Repeat the template slide N times into a full deck, varying body content."""
    tmpl = _read(TEMPLATE)
    m = re.search(r"(<section\s[^>]*class=\"slide\"[^>]*>.*?</section>)", tmpl, re.DOTALL)
    if not m:
        raise ValueError("No slide found in template")
    slide_html = m.group(1)
    before = tmpl[: tmpl.index("<body>")] + "<body>\n"
    after = "\n</body>\n</html>"

    parts = [before]
    for i in range(1, slide_count + 1):
        s = slide_html
        s = re.sub(r"TOPIC · \d+", f"TOPIC · {i:02d}", s, count=1)
        s = re.sub(r"\d+ / \d+", f"{i:02d} / {slide_count}", s, count=1)
        s = s.replace(
            "<p>Placeholder body content. Replace with authored slide content.</p>",
            f"<p>Slide {i} body content.</p>",
        )
        parts.append(s)
    parts.append(after)
    return "\n".join(parts)


def _extract_frame(slide_html):
    """Extract the frame skeleton (everything outside body-safe-area) from a slide."""
    frame = re.sub(
        r'(<div[^>]*\bid\s*=\s*["\x27]body-safe-area["\x27][^>]*>).*?(</div>)',
        r'\1\2',
        slide_html,
        flags=re.DOTALL,
    )
    return frame


def _extract_body_body(slide_html):
    """Extract inner HTML from body-safe-area."""
    m = re.search(
        r'<div[^>]*\bid\s*=\s*["\x27]body-safe-area["\x27][^>]*>(.*?)</div>',
        slide_html,
        re.DOTALL,
    )
    return m.group(1) if m else ""


def tmpl_normalize(s):
    """Normalize whitespace for structural comparison."""
    return re.sub(r'\s+', ' ', s).strip()


def frame_blank_vars(s):
    """Blank variable text in eyebrow/num so structural comparison works."""
    s = re.sub(r'class="eyebrow"[^>]*>[^<]+', 'class="eyebrow">__', s)
    s = re.sub(r'class="num"[^>]*>[^<]+', 'class="num">__', s)
    return s


failures = 0

def t(name, fn):
    global failures
    try:
        fn()
        print(f"PASS {name}")
    except Exception as e:
        print(f"FAIL {name}: {e}")
        failures += 1


# ── template structure ──────────────────────────────────────────────

def _test_exists():
    assert os.path.isfile(TEMPLATE), f"Missing {TEMPLATE}"

def _test_safe_area():
    html = _read(TEMPLATE)
    areas = re.findall(r'<div[^>]*\bid\s*=\s*["\x27]body-safe-area["\x27]', html)
    assert len(areas) == 1, f"Expected 1 body-safe-area, found {len(areas)}"

def _test_header():
    assert 'class="eyebrow"' in _read(TEMPLATE), "Header (.eyebrow) missing"

def _test_footer():
    assert 'class="num"' in _read(TEMPLATE), "Footer (.num) missing"

def _test_dimensions():
    html = _read(TEMPLATE)
    assert re.search(r"width\s*:\s*1080px", html, re.I), "Missing width: 1080px"
    assert re.search(r"height\s*:\s*1350px", html, re.I), "Missing height: 1350px"

# ── forbidden content ──────────────────────────────────────────────

FORBIDDEN = [
    (r"<script[\s>]", "<script>"),
    (r'\son\w+\s*=\s*["\x27]', "on* attribute"),
    (r"@keyframes\b", "@keyframes"),
    (r"(?:animation|transition)\s*:", "animation/transition property"),
    (r'href\s*=\s*["\x27]https?://', "external href"),
    (r'src\s*=\s*["\x27]https?://', "external src"),
    (r'@import\s+(?:url\()?\s*["\x27]?https?://', "CSS @import external"),
    (r'url\(\s*["\x27]?https?://', "CSS url() external"),
    (r"@font-face\s*\{", "@font-face"),
]

for _pat, _label in FORBIDDEN:
    def _make_test(pat, label):
        def _test():
            assert not re.search(pat, _read(TEMPLATE), re.I), f"Forbidden: {label}"
        return _test
    t(f"no_{_label.replace(' ', '_').replace('*','').replace('@','at').replace('<','').replace('>','').replace('/','_').replace('.','')}",
      _make_test(_pat, _label))

# ── generated deck passes validator ─────────────────────────────────

def _test_deck_passes():
    deck = _build_deck(10)
    with tempfile.NamedTemporaryFile(mode="w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(deck)
        path = f.name
    try:
        r = subprocess.run([sys.executable, CHECK_DECK, path], capture_output=True, text=True)
        assert r.returncode == 0, f"Validator failed (exit {r.returncode}):\n{r.stdout}{r.stderr}"
    finally:
        os.unlink(path)


# ── frame preservation in generated deck ────────────────────────────

def _test_frame_preserved():
    """Every slide preserves the template frame skeleton structurally."""
    tmpl_html = _read(TEMPLATE)
    m = re.search(r"(<section\s[^>]*class=\"slide\"[^>]*>.*?</section>)", tmpl_html, re.DOTALL)
    template_skeleton = _extract_frame(m.group(1))

    deck = _build_deck(10)
    slides = re.findall(r"<section\s[^>]*class=\"slide\"[^>]*>.*?</section>", deck, re.DOTALL)
    assert len(slides) == 10, f"expected 10 slides, found {len(slides)}"

    for i, s in enumerate(slides):
        skel = _extract_frame(s)
        expected = tmpl_normalize(template_skeleton)
        got = tmpl_normalize(skel)
        if expected != got:
            # Re-check with variable text (eyebrow, num) blanked out
            assert frame_blank_vars(expected) == frame_blank_vars(got), \
                f"slide {i+1} frame differs from template"


def _test_body_varies():
    """Body-safe-area content varies across slides."""
    deck = _build_deck(10)
    slides = re.findall(r"<section\s[^>]*class=\"slide\"[^>]*>.*?</section>", deck, re.DOTALL)
    bodies = [_extract_body_body(s) for s in slides]
    distinct = set(b.strip() for b in bodies)
    assert len(distinct) == 10, f"expected 10 distinct bodies, got {len(distinct)}"


def _test_each_has_eyebrow():
    deck = _build_deck(10)
    slides = re.findall(r"<section\s[^>]*class=\"slide\"[^>]*>.*?</section>", deck, re.DOTALL)
    for i, slide in enumerate(slides):
        assert 'class="eyebrow"' in slide, f"slide {i+1} missing .eyebrow"


def _test_each_has_num():
    deck = _build_deck(10)
    slides = re.findall(r"<section\s[^>]*class=\"slide\"[^>]*>.*?</section>", deck, re.DOTALL)
    for i, slide in enumerate(slides):
        assert 'class="num"' in slide, f"slide {i+1} missing .num"


# Run

t("template_exists", _test_exists)
t("one_body_safe_area", _test_safe_area)
t("header_eyebrow", _test_header)
t("footer_num", _test_footer)
t("dimensions_1080x1350", _test_dimensions)
t("generated_deck_passes_validator", _test_deck_passes)
t("frame_preserved_on_every_slide", _test_frame_preserved)
t("body_content_varies", _test_body_varies)
t("each_slide_has_eyebrow", _test_each_has_eyebrow)
t("each_slide_has_num", _test_each_has_num)

if failures:
    print(f"\n{failures} FAILED")
    sys.exit(1)
print("\nAll tests passed.")
