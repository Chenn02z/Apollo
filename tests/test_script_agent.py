"""Tests for the Script Agent (spec 0002)."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from io import StringIO
from pathlib import Path
from unittest import mock

import pytest

from script_agent import ScriptError, generate_script
from script_agent.provider import (
    ProviderError,
    ScriptPackage,
    VisualBeat,
    call_llm,
)

ROOT = Path(__file__).resolve().parents[1]


def _cli_env() -> dict[str, str]:
    env = os.environ.copy()
    src_path = str(ROOT / "src")
    existing = env.get("PYTHONPATH")
    env["PYTHONPATH"] = src_path if not existing else os.pathsep.join([src_path, existing])
    return env


def _make_pkg(
    topic: str = "Test Topic",
    angle: str = "Test Angle",
    narration: str = "This is a test narration with enough words to meet the word count requirement for a short video script about a technical topic aimed at developers.",
    visual_beats: list[VisualBeat] | None = None,
    duration: int = 75,
    audience: str = "software developers preparing for technical interviews",
) -> ScriptPackage:
    if visual_beats is None:
        visual_beats = [
            VisualBeat("0:00", "Title card"),
            VisualBeat("0:15", "Diagram"),
            VisualBeat("0:40", "Code example"),
            VisualBeat("1:05", "Recap"),
        ]
    return ScriptPackage(
        topic=topic,
        angle=angle,
        narration=narration,
        visual_beats=visual_beats,
        duration_estimate_s=duration,
        target_audience=audience,
    )


# --- Unit: generate_script with mocked provider ---

def test_generate_script_returns_all_required_fields() -> None:
    with mock.patch(
        "script_agent.script.call_llm",
        return_value=_make_pkg(),
    ):
        result = generate_script({"topic": "How HTTPS Works"})

    assert set(result) == {
        "topic", "angle", "narration", "visual_beats",
        "duration_estimate_s", "target_audience",
    }
    assert isinstance(result["topic"], str) and len(result["topic"]) > 0
    assert isinstance(result["angle"], str) and len(result["angle"]) > 0
    assert isinstance(result["narration"], str) and len(result["narration"]) > 0
    assert isinstance(result["visual_beats"], list) and len(result["visual_beats"]) >= 4
    assert isinstance(result["duration_estimate_s"], int)
    assert isinstance(result["target_audience"], str) and len(result["target_audience"]) > 0


def test_generate_script_with_angle_seed_passes_through() -> None:
    captured_seed: str | None = None

    def fake_call(topic: str, angle_seed: str | None) -> ScriptPackage:
        nonlocal captured_seed
        captured_seed = angle_seed
        return _make_pkg(topic=topic, angle=angle_seed if angle_seed else "Synthesized")

    with mock.patch("script_agent.script.call_llm", side_effect=fake_call):
        generate_script({"topic": "DNS", "angle": "DNS as a phonebook"})

    assert captured_seed == "DNS as a phonebook"


def test_generate_script_without_angle_synthesizes() -> None:
    captured_seed: str | None = "NOT_CALLED"

    def fake_call(topic: str, angle_seed: str | None) -> ScriptPackage:
        nonlocal captured_seed
        captured_seed = angle_seed
        return _make_pkg(topic=topic)

    with mock.patch("script_agent.script.call_llm", side_effect=fake_call):
        generate_script({"topic": "DNS"})

    assert captured_seed is None


def test_output_angle_is_authoritative_not_seed() -> None:
    with mock.patch(
        "script_agent.script.call_llm",
        return_value=_make_pkg(angle="Refined authoritative angle"),
    ):
        result = generate_script({"topic": "DNS", "angle": "Original seed"})

    assert result["angle"] == "Refined authoritative angle"


def test_topic_is_echoed_unchanged() -> None:
    with mock.patch(
        "script_agent.script.call_llm",
        return_value=_make_pkg(topic="Ignored LLM topic"),
    ):
        result = generate_script({"topic": "Original topic"})

    assert result["topic"] == "Original topic"


# --- Unit: narration constraints ---

def test_narration_is_speakable_prose_no_markdown() -> None:
    pkg = _make_pkg(narration="This is a clear sentence. No markdown at all.")
    with mock.patch("script_agent.script.call_llm", return_value=pkg):
        result = generate_script({"topic": "Test"})

    narration = result["narration"]
    assert "**" not in narration
    assert "##" not in narration
    assert "```" not in narration
    assert "* " not in narration and "- " not in narration
    assert "(" not in narration or ")" not in narration  # no parentheticals


def test_narration_has_adequate_word_count() -> None:
    narration = " ".join(["word"] * 180)
    with mock.patch(
        "script_agent.script.call_llm",
        return_value=_make_pkg(narration=narration),
    ):
        result = generate_script({"topic": "Test"})

    words = result["narration"].split()
    assert 135 <= len(words) <= 225


# --- Unit: visual beats ---

def test_visual_beats_have_at_least_four_entries() -> None:
    with mock.patch(
        "script_agent.script.call_llm",
        return_value=_make_pkg(visual_beats=[
            VisualBeat("0:00", "Title"),
            VisualBeat("0:15", "Diagram"),
            VisualBeat("0:40", "Code"),
            VisualBeat("1:05", "Recap"),
            VisualBeat("1:15", "Outro"),
        ]),
    ):
        result = generate_script({"topic": "Test"})

    assert len(result["visual_beats"]) >= 4


def test_visual_beats_start_at_zero() -> None:
    with mock.patch(
        "script_agent.script.call_llm",
        return_value=_make_pkg(visual_beats=[
            VisualBeat("0:00", "Opening"),
            VisualBeat("0:20", "Middle"),
            VisualBeat("0:50", "Near end"),
            VisualBeat("1:10", "Closing"),
        ]),
    ):
        result = generate_script({"topic": "Test"})

    assert result["visual_beats"][0]["timestamp"] == "0:00"


def test_visual_beats_have_required_shape() -> None:
    with mock.patch("script_agent.script.call_llm", return_value=_make_pkg()):
        result = generate_script({"topic": "Test"})

    for vb in result["visual_beats"]:
        assert isinstance(vb["timestamp"], str) and len(vb["timestamp"]) > 0
        assert isinstance(vb["description"], str) and len(vb["description"]) > 0


# --- Unit: duration ---

def test_duration_within_range() -> None:
    for dur in (60, 75, 90):
        with mock.patch(
            "script_agent.script.call_llm",
            return_value=_make_pkg(duration=dur),
        ):
            result = generate_script({"topic": "Test"})

        assert 60 <= result["duration_estimate_s"] <= 90


def test_duration_outside_range_warns(capsys) -> None:
    with mock.patch(
        "script_agent.script.call_llm",
        return_value=_make_pkg(duration=45),
    ):
        result = generate_script({"topic": "Test"})

    assert result["duration_estimate_s"] == 45
    captured = capsys.readouterr()
    assert "warning" in captured.err.lower()
    assert "45" in captured.err


# --- Unit: generate_script failure modes ---

def test_missing_topic_raises() -> None:
    with pytest.raises(ScriptError, match="must contain a 'topic'"):
        generate_script({"angle": "something"})


def test_empty_topic_raises() -> None:
    with pytest.raises(ScriptError, match="topic must be a non-empty string"):
        generate_script({"topic": "   "})


def test_whitespace_topic_raises() -> None:
    with pytest.raises(ScriptError, match="topic must be a non-empty string"):
        generate_script({"topic": "\n\t  "})


def test_invalid_input_type_raises() -> None:
    with pytest.raises(ScriptError, match="input must be a JSON object"):
        generate_script([1, 2, 3])  # type: ignore[arg-type]


def test_empty_angle_raises() -> None:
    with pytest.raises(ScriptError, match="angle must be a non-empty string if provided"):
        generate_script({"topic": "Test", "angle": "   "})


def test_provider_error_retries_once_then_surfaces() -> None:
    call_count = 0

    def fail_twice(_topic, _angle_seed):
        nonlocal call_count
        call_count += 1
        raise ProviderError("test provider error")

    with mock.patch("script_agent.script.call_llm", side_effect=fail_twice):
        with pytest.raises(ScriptError, match="test provider error"):
            generate_script({"topic": "Test"})

    assert call_count == 2


# --- Unit: provider ---

def test_call_llm_parses_valid_response(monkeypatch) -> None:
    monkeypatch.setenv("OPENROUTER_API_KEY", "sk-test")

    fake_response = mock.Mock()
    fake_response.raise_for_status = mock.Mock()
    fake_response.json.return_value = {
        "choices": [{"message": {"content": json.dumps({
            "angle": "Test angle",
            "narration": "Test narration with enough words to fill the required count for a short video script.",
            "visual_beats": [
                {"timestamp": "0:00", "description": "Opening"},
                {"timestamp": "0:20", "description": "Middle"},
                {"timestamp": "0:50", "description": "Near end"},
                {"timestamp": "1:10", "description": "Closing"},
            ],
            "duration_estimate_s": 75,
            "target_audience": "developers",
        })}}]
    }

    with mock.patch("script_agent.provider.httpx.post", return_value=fake_response):
        pkg = call_llm("Test", None)

    assert pkg.angle == "Test angle"
    assert pkg.narration.startswith("Test narration")
    assert len(pkg.visual_beats) == 4
    assert pkg.duration_estimate_s == 75
    assert pkg.target_audience == "developers"


def test_call_llm_unparseable_raises(monkeypatch) -> None:
    monkeypatch.setenv("OPENROUTER_API_KEY", "sk-test")

    fake_response = mock.Mock()
    fake_response.raise_for_status = mock.Mock()
    fake_response.json.return_value = {
        "choices": [{"message": {"content": "not valid json"}}]
    }

    with mock.patch("script_agent.provider.httpx.post", return_value=fake_response):
        with pytest.raises(ProviderError, match="unparseable"):
            call_llm("Test", None)


def test_call_llm_missing_required_fields_raises(monkeypatch) -> None:
    monkeypatch.setenv("OPENROUTER_API_KEY", "sk-test")

    fake_response = mock.Mock()
    fake_response.raise_for_status = mock.Mock()
    fake_response.json.return_value = {
        "choices": [{"message": {"content": json.dumps({
            "angle": "ok",
            # missing narration, visual_beats, etc.
        })}}]
    }

    with mock.patch("script_agent.provider.httpx.post", return_value=fake_response):
        with pytest.raises(ProviderError, match="missing required fields"):
            call_llm("Test", None)


def test_call_llm_fewer_than_four_beats_raises(monkeypatch) -> None:
    monkeypatch.setenv("OPENROUTER_API_KEY", "sk-test")

    fake_response = mock.Mock()
    fake_response.raise_for_status = mock.Mock()
    fake_response.json.return_value = {
        "choices": [{"message": {"content": json.dumps({
            "angle": "ok",
            "narration": "Test narration.",
            "visual_beats": [
                {"timestamp": "0:00", "description": "One"},
                {"timestamp": "0:30", "description": "Two"},
            ],
            "duration_estimate_s": 60,
            "target_audience": "devs",
        })}}]
    }

    with mock.patch("script_agent.provider.httpx.post", return_value=fake_response):
        with pytest.raises(ProviderError, match="at least 4 entries"):
            call_llm("Test", None)


def test_call_llm_missing_api_key() -> None:
    with mock.patch.dict(os.environ, {}, clear=True):
        with pytest.raises(ProviderError, match="OPENROUTER_API_KEY"):
            call_llm("Test", None)


def test_call_llm_model_not_found_fails_fast(monkeypatch) -> None:
    monkeypatch.setenv("OPENROUTER_API_KEY", "sk-test")
    from httpx import HTTPStatusError, Request, Response

    fake_error = HTTPStatusError(
        "not found",
        request=Request("POST", "https://example.com"),
        response=Response(404),
    )

    with mock.patch("script_agent.provider.httpx.post", side_effect=fake_error):
        with pytest.raises(ProviderError, match="model not available"):
            call_llm("Test", None)


# --- Unit: config keys ---

def test_default_model_is_deepseek_v4_pro() -> None:
    with mock.patch.dict(os.environ, {}, clear=True):
        from script_agent.provider import _model
        assert _model() == "deepseek/deepseek-v4-pro"


def test_script_model_env_overrides_default() -> None:
    with mock.patch.dict(os.environ, {"SCRIPT_MODEL": "custom/model"}, clear=True):
        from script_agent.provider import _model
        assert _model() == "custom/model"


def test_default_temperature_is_0_3() -> None:
    with mock.patch.dict(os.environ, {}, clear=True):
        from script_agent.provider import _temperature
        assert _temperature() == 0.3


def test_script_temperature_env_overrides() -> None:
    with mock.patch.dict(os.environ, {"SCRIPT_TEMPERATURE": "0.7"}, clear=True):
        from script_agent.provider import _temperature
        assert _temperature() == 0.7


def test_default_max_duration_is_90() -> None:
    with mock.patch.dict(os.environ, {}, clear=True):
        from script_agent.provider import _max_duration_s
        assert _max_duration_s() == 90


def test_script_max_duration_env_overrides() -> None:
    with mock.patch.dict(os.environ, {"SCRIPT_MAX_DURATION_S": "120"}, clear=True):
        from script_agent.provider import _max_duration_s
        assert _max_duration_s() == 120


def test_default_min_duration_is_60() -> None:
    with mock.patch.dict(os.environ, {}, clear=True):
        from script_agent.provider import _min_duration_s
        assert _min_duration_s() == 60


# --- CLI smoke tests ---

def test_cli_script_exits_zero_with_mock() -> None:
    import sys
    from io import StringIO

    from apollo.cli import main

    with mock.patch(
        "script_agent.script.call_llm",
        return_value=_make_pkg(
            topic="How HTTPS Works",
            angle="Refined angle",
            narration="Enough words for the narration requirement in the script test.",
        ),
    ):
        buf = StringIO()
        rc = None
        with mock.patch("sys.stdout", buf):
            rc = main(["script", '{"topic":"How HTTPS Works"}'])

        assert rc == 0
        output = buf.getvalue()
        parsed = json.loads(output)
        assert parsed["topic"] == "How HTTPS Works"
        assert parsed["angle"] == "Refined angle"
        assert "visual_beats" in parsed
        assert "duration_estimate_s" in parsed


def test_cli_script_with_angle_exits_zero_with_mock() -> None:
    from io import StringIO

    from apollo.cli import main

    with mock.patch(
        "script_agent.script.call_llm",
        return_value=_make_pkg(),
    ):
        buf = StringIO()
        with mock.patch("sys.stdout", buf):
            rc = main(["script", '{"topic":"DNS","angle":"Phonebook analogy"}'])

        assert rc == 0


def test_cli_script_stdin_mode_exits_zero_with_mock() -> None:
    from io import StringIO

    from apollo.cli import main

    with mock.patch(
        "script_agent.script.call_llm",
        return_value=_make_pkg(),
    ):
        buf = StringIO()
        stdin_buf = StringIO('{"topic":"stdin test"}')
        with mock.patch("sys.stdout", buf), mock.patch("sys.stdin", stdin_buf):
            rc = main(["script", "-"])

        assert rc == 0


def test_cli_script_malformed_json_returns_error() -> None:
    from apollo.cli import main

    from io import StringIO

    buf = StringIO()
    with mock.patch("sys.stderr", buf):
        rc = main(["script", "not json"])

    assert rc == 1
    assert "malformed" in buf.getvalue().lower()


def test_cli_script_missing_topic_returns_error() -> None:
    from apollo.cli import main

    from io import StringIO

    buf = StringIO()
    with mock.patch("sys.stderr", buf):
        rc = main(["script", '{"angle":"no topic"}'])

    assert rc == 1
    assert "topic" in buf.getvalue().lower()


def test_apollo_missing_command_shows_help() -> None:
    result = subprocess.run(
        [sys.executable, "-m", "apollo"],
        cwd=ROOT,
        env=_cli_env(),
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode != 0


# --- Contract test: 0001 output pipes into 0002 input ---

def test_ideation_output_is_valid_script_input() -> None:
    """Verify that concept_ideation output shape is accepted by script_agent."""
    with mock.patch(
        "script_agent.script.call_llm",
        return_value=_make_pkg(topic="How Attention Mechanisms Let LLMs Read Whole Paragraphs at Once"),
    ):
        # Simulate what ideation would produce
        ideation_output = {
            "topic": "How Attention Mechanisms Let LLMs Read Whole Paragraphs at Once",
            "angle": "Visual breakdown of self-attention as a weighted lookup table",
        }
        result = generate_script(ideation_output)

    assert result["topic"] == ideation_output["topic"]
    assert set(result) == {
        "topic", "angle", "narration", "visual_beats",
        "duration_estimate_s", "target_audience",
    }


def test_script_input_with_only_topic_is_valid() -> None:
    with mock.patch(
        "script_agent.script.call_llm",
        return_value=_make_pkg(topic="Minimal test"),
    ):
        result = generate_script({"topic": "Minimal test"})

    assert result["topic"] == "Minimal test"
    assert isinstance(result["angle"], str) and len(result["angle"]) > 0


# --- Unit: content quality checks ---

def test_content_targets_developers() -> None:
    with mock.patch("script_agent.script.call_llm", return_value=_make_pkg()):
        result = generate_script({"topic": "Test"})

    assert "developer" in result["target_audience"].lower()


# --- Repeatability: run same test twice to catch flakiness ---

def test_repeatable_output_with_same_input_mock() -> None:
    """Run generate_script twice with same input, verify consistency."""
    pkg = _make_pkg(topic="Consistent", angle="Same angle")

    with mock.patch("script_agent.script.call_llm", return_value=pkg):
        result1 = generate_script({"topic": "Consistent"})

    with mock.patch("script_agent.script.call_llm", return_value=pkg):
        result2 = generate_script({"topic": "Consistent"})

    assert result1 == result2
    assert result1["topic"] == result2["topic"]
    assert result1["angle"] == result2["angle"]
    assert result1["duration_estimate_s"] == result2["duration_estimate_s"]
    assert result1["visual_beats"] == result2["visual_beats"]
