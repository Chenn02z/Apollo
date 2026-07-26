"""Tests for the frame template contracts (specs 0003 and 0004). Stdlib-only."""

import os
import re
import subprocess
import sys
import tempfile

PROJECT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRAME = os.path.join(PROJECT, "templates", "frame.html")
FIRST_FRAME = os.path.join(PROJECT, "templates", "first-frame.html")
CHECK_DECK = os.path.join(PROJECT, "scripts", "check-deck.py")

FAILURES = 0

def t(name, fn):
    global FAILURES
    try:
        fn()
        print(f"PASS {name}")
    except Exception as e:
        print(f"FAIL {name}: {e}")
        FAILURES += 1


def _read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


# ── shared helpers ──────────────────────────────────────────────────

SEVEN_PALETTE = {
    "#1C1C1C", "#506B62", "#A85F47", "#5D7094",
    "#A9824F", "#806277", "#8E6A58",
}

REQUIRED_FONT_BODY = "Georgia"
REQUIRED_FONT_HEADING = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
REQUIRED_FONT_MONO = '"SF Mono", "Menlo", "Consolas", "Liberation Mono"'

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

RAIL_DIV_RE = re.compile(r'<div[^>]*class="rail"[^>]*>')
RAIL_LABEL_RE = re.compile(r'get cracked')


def _assert_forbidden(html, label):
    for pat, name in FORBIDDEN:
        assert not re.search(pat, html, re.I), f"{label}: forbidden {name}"


def _assert_seven_palette(html, label):
    hexes = set(re.findall(r'#[0-9A-Fa-f]{6}', html))
    allowed_extra = {"#faf8f5", "#e8e4dd"}
    stray = hexes - SEVEN_PALETTE - allowed_extra
    assert not stray, f"{label}: non-palette hex colors: {stray}"


def _assert_rail_chrome(html, label):
    assert RAIL_DIV_RE.search(html), f"{label}: missing .rail div"
    assert RAIL_LABEL_RE.search(html), f"{label}: missing 'get cracked' label"


def _assert_font_roles(html, label):
    assert REQUIRED_FONT_BODY in html, f"{label}: missing Georgia font-body"
    assert REQUIRED_FONT_HEADING in html, f"{label}: missing system sans heading stack"
    assert REQUIRED_FONT_MONO in html, f"{label}: missing SF Mono/Menlo mono stack"


def _assert_dimensions(html, label):
    assert re.search(r"width\s*:\s*1080px", html, re.I), f"{label}: missing width 1080px"
    assert re.search(r"height\s*:\s*1350px", html, re.I), f"{label}: missing height 1350px"


def _normalize(s):
    return re.sub(r'\s+', ' ', s).strip()


# ── frame.html tests ────────────────────────────────────────────────

def _test_frame_exists():
    assert os.path.isfile(FRAME), f"Missing {FRAME}"

def _test_frame_safe_area():
    html = _read(FRAME)
    areas = re.findall(r'<div[^>]*\bid\s*=\s*["\x27]body-safe-area["\x27]', html)
    assert len(areas) == 1, f"Expected 1 body-safe-area, found {len(areas)}"

def _test_frame_masthead():
    assert 'class="masthead"' in _read(FRAME), "frame: masthead missing"

def _test_frame_folio():
    assert 'class="folio"' in _read(FRAME), "frame: folio missing"

def _test_frame_dimensions():
    _assert_dimensions(_read(FRAME), "frame")

def _test_frame_palette():
    _assert_seven_palette(_read(FRAME), "frame")

def _test_frame_rail():
    _assert_rail_chrome(_read(FRAME), "frame")

def _test_frame_fonts():
    _assert_font_roles(_read(FRAME), "frame")

def _test_frame_forbidden():
    _assert_forbidden(_read(FRAME), "frame")

def _test_frame_archetypes():
    html = _read(FRAME)
    for name in ["archetype-hero", "archetype-fact", "archetype-quote",
                 "archetype-split", "archetype-flow", "archetype-grid"]:
        assert f".{name}" in html, f"frame: missing archetype class {name}"


# ── first-frame.html tests ──────────────────────────────────────────

def _test_ff_exists():
    assert os.path.isfile(FIRST_FRAME), f"Missing {FIRST_FRAME}"

def _test_ff_no_safe_area():
    html = _read(FIRST_FRAME)
    assert 'id="body-safe-area"' not in html, "first-frame: must not have body-safe-area"

def _test_ff_no_archetype_class():
    html = _read(FIRST_FRAME)
    assert "archetype-" not in html, "first-frame: must not have archetype-* class"

def _test_ff_placeholder_slots():
    html = _read(FIRST_FRAME)
    assert "[CATEGORY]" in html, "first-frame: missing [CATEGORY] placeholder"
    assert "[TOPIC]" in html, "first-frame: missing [TOPIC] placeholder"
    assert "[COMMENTARY]" in html, "first-frame: missing [COMMENTARY] placeholder"

def _test_ff_dimensions():
    _assert_dimensions(_read(FIRST_FRAME), "first-frame")

def _test_ff_palette():
    _assert_seven_palette(_read(FIRST_FRAME), "first-frame")

def _test_ff_rail():
    _assert_rail_chrome(_read(FIRST_FRAME), "first-frame")

def _test_ff_fonts():
    _assert_font_roles(_read(FIRST_FRAME), "first-frame")

def _test_ff_forbidden():
    _assert_forbidden(_read(FIRST_FRAME), "first-frame")

def _test_ff_rail_geometry():
    html = _read(FIRST_FRAME)
    assert "top: 10%;" in html, "first-frame: rail top 10%"
    assert "bottom: 10%;" in html, "first-frame: rail bottom 10%"
    assert "left: 28px;" in html, "first-frame: rail left 28px"
    assert "width: 8px;" in html, "first-frame: rail width 8px"
    assert "left: 8px;" in html, "first-frame: label left 8px"
    assert "transform: rotate(-90deg);" in html, "first-frame: label rotate -90deg"

def _test_ff_single_slide():
    html = _read(FIRST_FRAME)
    slides = re.findall(r'<section[^>]*class="slide"[^>]*>', html)
    assert len(slides) == 1, f"first-frame: expected 1 slide, found {len(slides)}"

def _test_ff_category_commentary_fixed_color():
    html = _read(FIRST_FRAME)
    assert ".category" in html, "first-frame: missing .category class"
    assert ".commentary" in html, "first-frame: missing .commentary class"

def _test_ff_topic_default_ink():
    html = _read(FIRST_FRAME)
    assert ".topic" in html, "first-frame: missing .topic class"
    assert "color: #1C1C1C;" in html, "first-frame: topic default ink missing"


# ── generated deck smoke (frame.html only) ──────────────────────────

def _build_frame_deck(slide_count=10):
    tmpl = _read(FRAME)
    m = re.search(r"(<section\s[^>]*class=\"slide\"[^>]*>.*?</section>)", tmpl, re.DOTALL)
    if not m:
        raise ValueError("No slide found in frame.html")
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


def _extract_frame_skeleton(slide_html):
    """Remove body-safe-area inner content and blank variable chrome text."""
    s = re.sub(
        r'(<div[^>]*\bid\s*=\s*["\x27]body-safe-area["\x27][^>]*>).*?(</div>)',
        r'\1\2',
        slide_html,
        flags=re.DOTALL,
    )
    s = re.sub(r'class="section-label"[^>]*>[^<]+', 'class="section-label">__', s)
    s = re.sub(r'class="folio-page"[^>]*>[^<]+', 'class="folio-page">__', s)
    return s


def _test_frame_deck_passes():
    deck = _build_frame_deck(10)
    with tempfile.NamedTemporaryFile(mode="w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(deck)
        path = f.name
    try:
        r = subprocess.run([sys.executable, CHECK_DECK, path], capture_output=True, text=True)
        assert r.returncode == 0, f"Validator failed (exit {r.returncode}):\n{r.stdout}{r.stderr}"
    finally:
        os.unlink(path)


def _test_frame_preserved():
    tmpl_html = _read(FRAME)
    m = re.search(r"(<section\s[^>]*class=\"slide\"[^>]*>.*?</section>)", tmpl_html, re.DOTALL)
    template_skeleton = _extract_frame_skeleton(m.group(1))
    deck = _build_frame_deck(10)
    slides = re.findall(r"<section\s[^>]*class=\"slide\"[^>]*>.*?</section>", deck, re.DOTALL)
    assert len(slides) == 10
    for i, s in enumerate(slides):
        skel = _extract_frame_skeleton(s)
        assert _normalize(template_skeleton) == _normalize(skel), \
            f"slide {i+1} frame differs from template"


def _test_frame_body_varies():
    deck = _build_frame_deck(10)
    slides = re.findall(r"<section\s[^>]*class=\"slide\"[^>]*>.*?</section>", deck, re.DOTALL)
    bodies = []
    for s in slides:
        m = re.search(
            r'<div[^>]*\bid\s*=\s*["\x27]body-safe-area["\x27][^>]*>(.*?)</div>',
            s, re.DOTALL,
        )
        bodies.append(m.group(1) if m else "")
    assert len(set(b.strip() for b in bodies)) == 10, "expected 10 distinct bodies"


def _test_frame_chrome_present():
    deck = _build_frame_deck(10)
    slides = re.findall(r"<section\s[^>]*class=\"slide\"[^>]*>.*?</section>", deck, re.DOTALL)
    for i, slide in enumerate(slides):
        assert 'class="masthead"' in slide, f"slide {i+1} missing masthead"
        assert 'class="folio"' in slide, f"slide {i+1} missing folio"
        assert RAIL_DIV_RE.search(slide), f"slide {i+1} missing rail"
        assert RAIL_LABEL_RE.search(slide), f"slide {i+1} missing 'get cracked'"


# ── run ─────────────────────────────────────────────────────────────

t("frame_exists", _test_frame_exists)
t("frame_one_body_safe_area", _test_frame_safe_area)
t("frame_masthead", _test_frame_masthead)
t("frame_folio", _test_frame_folio)
t("frame_dimensions_1080x1350", _test_frame_dimensions)
t("frame_seven_palette", _test_frame_palette)
t("frame_rail_chrome", _test_frame_rail)
t("frame_font_roles", _test_frame_fonts)
t("frame_no_forbidden", _test_frame_forbidden)
t("frame_archetype_classes", _test_frame_archetypes)

t("ff_exists", _test_ff_exists)
t("ff_no_body_safe_area", _test_ff_no_safe_area)
t("ff_no_archetype_class", _test_ff_no_archetype_class)
t("ff_placeholder_slots", _test_ff_placeholder_slots)
t("ff_dimensions_1080x1350", _test_ff_dimensions)
t("ff_seven_palette", _test_ff_palette)
t("ff_rail_chrome", _test_ff_rail)
t("ff_font_roles", _test_ff_fonts)
t("ff_no_forbidden", _test_ff_forbidden)
t("ff_rail_geometry", _test_ff_rail_geometry)
t("ff_single_slide", _test_ff_single_slide)
t("ff_category_commentary_fixed_color", _test_ff_category_commentary_fixed_color)
t("ff_topic_default_ink", _test_ff_topic_default_ink)

t("frame_deck_passes_validator", _test_frame_deck_passes)
t("frame_preserved_on_every_slide", _test_frame_preserved)
t("frame_body_content_varies", _test_frame_body_varies)
t("frame_chrome_present_on_every_slide", _test_frame_chrome_present)

if FAILURES:
    print(f"\n{FAILURES} FAILED")
    sys.exit(1)
print(f"\nAll {27} tests passed.")
