"""Tests for templates/manifest.json contract (spec 0004). Stdlib-only."""

import json
import os
import sys

PROJECT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(PROJECT, "templates", "manifest.json")

failures = 0


def t(name, fn):
    global failures
    try:
        fn()
        print(f"PASS {name}")
    except Exception as e:
        print(f"FAIL {name}: {e}")
        failures += 1


def _load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _validate(manifest):
    """Inline manifest validator matching SKILL.md rules."""
    allowed = {"content_revision_limit", "visual_revision_limit"}
    extra = set(manifest.keys()) - allowed
    if extra:
        raise ValueError(f"unknown keys: {extra}")

    for key in allowed:
        if key in manifest:
            val = manifest[key]
            if not isinstance(val, int) or isinstance(val, bool):
                raise ValueError(f"{key}={val!r} not an integer")
            if val < 0 or val > 5:
                raise ValueError(f"{key}={val} out of range 0-5")


def _resolve(manifest):
    """Resolve defaults: omitted keys -> 1."""
    return {
        "content_revision_limit": manifest.get("content_revision_limit", 1),
        "visual_revision_limit": manifest.get("visual_revision_limit", 1),
    }


# ── checked-in manifest ─────────────────────────────────────────────

def _test_manifest_exists():
    assert os.path.isfile(MANIFEST), f"Missing {MANIFEST}"


def _test_valid_json():
    m = _load(MANIFEST)
    assert isinstance(m, dict), "not a JSON object"


def _test_exactly_two_keys():
    m = _load(MANIFEST)
    keys = set(m.keys())
    expected = {"content_revision_limit", "visual_revision_limit"}
    assert keys == expected, f"expected {expected}, got {keys}"


def _test_values_are_ints_in_range():
    m = _load(MANIFEST)
    for k in ("content_revision_limit", "visual_revision_limit"):
        v = m[k]
        assert isinstance(v, int) and not isinstance(v, bool), f"{k}={v!r} not int"
        assert 0 <= v <= 5, f"{k}={v} out of range 0-5"


# ── defaults ───────────────────────────────────────────────────────

def _test_empty_defaults():
    m = _resolve({})
    assert m == {"content_revision_limit": 1, "visual_revision_limit": 1}, f"got {m}"


def _test_content_only_defaults_visual():
    m = _resolve({"content_revision_limit": 0})
    assert m == {"content_revision_limit": 0, "visual_revision_limit": 1}, f"got {m}"


def _test_visual_only_defaults_content():
    m = _resolve({"visual_revision_limit": 3})
    assert m == {"content_revision_limit": 1, "visual_revision_limit": 3}, f"got {m}"


# ── range boundaries ───────────────────────────────────────────────

def _test_zero_zero():
    _validate({"content_revision_limit": 0, "visual_revision_limit": 0})


def _test_five_five():
    _validate({"content_revision_limit": 5, "visual_revision_limit": 5})


def _test_zero_five():
    _validate({"content_revision_limit": 0, "visual_revision_limit": 5})


# ── error: extra keys ──────────────────────────────────────────────

def _test_extra_key_rejected():
    try:
        _validate({"content_revision_limit": 1, "visual_revision_limit": 1, "foo": 2})
        raise AssertionError("should have raised")
    except ValueError as e:
        assert "foo" in str(e)


# ── error: non-integer values ──────────────────────────────────────

def _test_float_rejected():
    try:
        _validate({"content_revision_limit": 1.5, "visual_revision_limit": 1})
        raise AssertionError("should have raised")
    except ValueError as e:
        assert "not an integer" in str(e)


def _test_string_rejected():
    try:
        _validate({"content_revision_limit": "1", "visual_revision_limit": 1})
        raise AssertionError("should have raised")
    except ValueError as e:
        assert "not an integer" in str(e)


def _test_bool_rejected():
    try:
        _validate({"content_revision_limit": 1, "visual_revision_limit": True})
        raise AssertionError("should have raised")
    except ValueError as e:
        assert "not an integer" in str(e)


def _test_null_rejected():
    try:
        _validate({"content_revision_limit": None, "visual_revision_limit": 1})
        raise AssertionError("should have raised")
    except ValueError as e:
        assert "not an integer" in str(e)


# ── error: out of range ────────────────────────────────────────────

def _test_negative_rejected():
    try:
        _validate({"content_revision_limit": -1, "visual_revision_limit": 1})
        raise AssertionError("should have raised")
    except ValueError as e:
        assert "out of range" in str(e)


def _test_above_five_rejected():
    try:
        _validate({"content_revision_limit": 1, "visual_revision_limit": 6})
        raise AssertionError("should have raised")
    except ValueError as e:
        assert "out of range" in str(e)


# ── error: invalid json ────────────────────────────────────────────

def _test_invalid_json_rejected():
    import tempfile
    fd, tmp = tempfile.mkstemp(suffix=".json")
    try:
        os.write(fd, b"not json")
        os.close(fd)
        json.loads(open(tmp).read())
        raise AssertionError("should have failed to parse")
    except json.JSONDecodeError:
        pass
    finally:
        os.unlink(tmp)


# Run

t("manifest_exists", _test_manifest_exists)
t("valid_json", _test_valid_json)
t("exactly_two_keys", _test_exactly_two_keys)
t("values_ints_in_range", _test_values_are_ints_in_range)
t("empty_defaults_to_1_1", _test_empty_defaults)
t("content_only_defaults_visual", _test_content_only_defaults_visual)
t("visual_only_defaults_content", _test_visual_only_defaults_content)
t("zero_zero_ok", _test_zero_zero)
t("five_five_ok", _test_five_five)
t("zero_five_ok", _test_zero_five)
t("extra_key_rejected", _test_extra_key_rejected)
t("float_rejected", _test_float_rejected)
t("string_rejected", _test_string_rejected)
t("bool_rejected", _test_bool_rejected)
t("null_rejected", _test_null_rejected)
t("negative_rejected", _test_negative_rejected)
t("above_five_rejected", _test_above_five_rejected)
t("invalid_json_rejected", _test_invalid_json_rejected)

if failures:
    print(f"\n{failures} FAILED")
    sys.exit(1)
print("\nAll tests passed.")
