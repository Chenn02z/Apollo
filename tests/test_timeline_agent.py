"""Tests for the Timeline Agent (spec 0003)."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from io import StringIO
from pathlib import Path
from unittest import mock

import pytest

from timeline_agent import TimelineError, generate_timeline, validate_timeline_draft
from timeline_agent.provider import (
    ModelNotAvailableError,
    ProviderError,
    TimelineDraftRaw,
    TimelineSegmentRaw,
)

ROOT = Path(__file__).resolve().parents[1]


def _cli_env() -> dict[str, str]:
    env = os.environ.copy()
    src_path = str(ROOT / "src")
    existing = env.get("PYTHONPATH")
    env["PYTHONPATH"] = src_path if not existing else os.pathsep.join([src_path, existing])
    return env


# --- Helpers ---

def _input_obj(**overrides: object) -> dict[str, object]:
    defaults: dict[str, object] = {
        "topic": "How Attention Mechanisms Work",
        "angle": "Self-attention as a weighted key-value lookup",
        "narration": "Ever wondered how LLMs process an entire sentence at once. "
                     "The secret is self-attention. Let's recap the key takeaways.",
        "visual_beats": [
            {"timestamp": "0:00", "description": "Title card: topic + hook question"},
            {"timestamp": "0:05", "description": "Diagram: query slides across key-value pairs"},
            {"timestamp": "0:15", "description": "Recap: three key takeaways"},
        ],
        "duration_estimate_s": 30,
        "target_audience": "software developers preparing for technical interviews",
    }
    defaults.update(overrides)
    return defaults


def _mock_segments() -> TimelineDraftRaw:
    """Three segments covering the helper narration with correct timing."""
    return TimelineDraftRaw(
        timeline_segments=[
            TimelineSegmentRaw(
                start_s=0.0,
                end_s=10.0,
                narration_text="Ever wondered how LLMs process an entire sentence at once.",
                subtitle_text="Ever wondered how LLMs process an entire sentence at once.",
            ),
            TimelineSegmentRaw(
                start_s=10.0,
                end_s=20.0,
                narration_text="The secret is self-attention.",
                subtitle_text="The secret is self-attention.",
            ),
            TimelineSegmentRaw(
                start_s=20.0,
                end_s=30.0,
                narration_text="Let's recap the key takeaways.",
                subtitle_text="Let's recap the key takeaways.",
            ),
        ]
    )


def _mock_segments_for(narration: str, duration_s: int = 30) -> TimelineDraftRaw:
    """Single segment exactly covering the given narration and duration."""
    return TimelineDraftRaw(
        timeline_segments=[
            TimelineSegmentRaw(0.0, float(duration_s), narration, narration),
        ]
    )


# --- Unit: generate_timeline with mocked provider ---

def test_generate_timeline_returns_all_required_fields() -> None:
    with mock.patch(
        "timeline_agent.timeline.call_llm",
        return_value=_mock_segments(),
    ):
        result = generate_timeline(_input_obj())

    assert set(result) == {
        "topic", "angle", "narration", "visual_beats",
        "duration_estimate_s", "target_audience", "timeline_segments",
    }
    assert isinstance(result["narration"], str) and len(result["narration"]) > 0
    assert isinstance(result["target_audience"], str) and len(result["target_audience"]) > 0
    assert isinstance(result["timeline_segments"], list) and len(result["timeline_segments"]) == 3


def test_narration_preserved_unchanged() -> None:
    inp = _input_obj()
    with mock.patch(
        "timeline_agent.timeline.call_llm",
        return_value=_mock_segments(),
    ):
        result = generate_timeline(inp)

    assert result["narration"] == inp["narration"]


def test_target_audience_preserved_unchanged() -> None:
    inp = _input_obj()
    with mock.patch(
        "timeline_agent.timeline.call_llm",
        return_value=_mock_segments(),
    ):
        result = generate_timeline(inp)

    assert result["target_audience"] == inp["target_audience"]


def test_passthrough_fields_copied_unchanged() -> None:
    inp = _input_obj()
    with mock.patch(
        "timeline_agent.timeline.call_llm",
        return_value=_mock_segments(),
    ):
        result = generate_timeline(inp)

    assert result["topic"] == inp["topic"]
    assert result["angle"] == inp["angle"]
    assert result["duration_estimate_s"] == inp["duration_estimate_s"]
    assert result["visual_beats"] == inp["visual_beats"]


def test_timeline_segments_are_ordered_and_contiguous() -> None:
    with mock.patch(
        "timeline_agent.timeline.call_llm",
        return_value=_mock_segments(),
    ):
        result = generate_timeline(_input_obj())

    segs = result["timeline_segments"]
    assert segs[0]["start_s"] == 0.0
    for i in range(1, len(segs)):
        assert segs[i]["start_s"] == segs[i - 1]["end_s"]


def test_final_end_within_one_second_of_duration() -> None:
    with mock.patch(
        "timeline_agent.timeline.call_llm",
        return_value=_mock_segments(),
    ):
        result = generate_timeline(_input_obj(duration_estimate_s=30))

    final_end = result["timeline_segments"][-1]["end_s"]
    assert abs(final_end - 30) <= 1.0


def test_one_segment_per_visual_beat() -> None:
    with mock.patch(
        "timeline_agent.timeline.call_llm",
        return_value=_mock_segments(),
    ):
        result = generate_timeline(_input_obj())

    assert len(result["timeline_segments"]) == len(_input_obj()["visual_beats"])


def test_visual_instruction_matches_beat_description() -> None:
    with mock.patch(
        "timeline_agent.timeline.call_llm",
        return_value=_mock_segments(),
    ):
        result = generate_timeline(_input_obj())

    beats = _input_obj()["visual_beats"]
    for i, seg in enumerate(result["timeline_segments"]):
        assert seg["visual_instruction"] == beats[i]["description"]


def test_narration_text_concatenation_preserves_narration() -> None:
    inp = _input_obj()
    with mock.patch(
        "timeline_agent.timeline.call_llm",
        return_value=_mock_segments(),
    ):
        result = generate_timeline(inp)

    concat = " ".join(seg["narration_text"] for seg in result["timeline_segments"])
    expected = inp["narration"]
    assert " ".join(concat.split()) == " ".join(expected.split())


def test_subtitle_text_equals_narration_text() -> None:
    with mock.patch(
        "timeline_agent.timeline.call_llm",
        return_value=_mock_segments(),
    ):
        result = generate_timeline(_input_obj())

    for seg in result["timeline_segments"]:
        assert seg["subtitle_text"] == seg["narration_text"]


def test_timeline_segments_start_end_are_numeric() -> None:
    with mock.patch(
        "timeline_agent.timeline.call_llm",
        return_value=_mock_segments(),
    ):
        result = generate_timeline(_input_obj())

    for seg in result["timeline_segments"]:
        assert isinstance(seg["start_s"], (int, float))
        assert isinstance(seg["end_s"], (int, float))


# --- Contract: invalid input ---

def test_missing_required_field_fails() -> None:
    for field in ("topic", "angle", "narration", "visual_beats",
                   "duration_estimate_s", "target_audience"):
        inp = _input_obj()
        del inp[field]
        with pytest.raises(TimelineError, match="missing required fields"):
            generate_timeline(inp)


def test_empty_narration_fails() -> None:
    with pytest.raises(TimelineError, match="narration must be a non-empty string"):
        generate_timeline(_input_obj(narration="   "))


def test_empty_visual_beats_fails() -> None:
    with pytest.raises(TimelineError, match="visual_beats must be a non-empty array"):
        generate_timeline(_input_obj(visual_beats=[]))


# --- Contract: mutated passthrough fails validation ---

def test_mutated_narration_fails_validation() -> None:
    inp = _input_obj()
    # Build a draft with 3 segments (matching visual_beats) but altered narration
    draft = {
        "topic": inp["topic"],
        "angle": inp["angle"],
        "narration": "Hacked narration part one. Part two. Part three.",
        "visual_beats": inp["visual_beats"],
        "duration_estimate_s": inp["duration_estimate_s"],
        "target_audience": inp["target_audience"],
        "timeline_segments": [
            {
                "start_s": 0.0,
                "end_s": 10.0,
                "narration_text": "Hacked narration part one.",
                "visual_instruction": inp["visual_beats"][0]["description"],
                "subtitle_text": "Hacked narration part one.",
            },
            {
                "start_s": 10.0,
                "end_s": 20.0,
                "narration_text": "Part two.",
                "visual_instruction": inp["visual_beats"][1]["description"],
                "subtitle_text": "Part two.",
            },
            {
                "start_s": 20.0,
                "end_s": 30.0,
                "narration_text": "Part three.",
                "visual_instruction": inp["visual_beats"][2]["description"],
                "subtitle_text": "Part three.",
            },
        ],
    }
    with pytest.raises(TimelineError, match="narration was mutated"):
        validate_timeline_draft(draft, inp)


def test_mutated_target_audience_fails_validation() -> None:
    inp = _input_obj()
    draft = {
        "topic": inp["topic"],
        "angle": inp["angle"],
        "narration": inp["narration"],
        "visual_beats": inp["visual_beats"],
        "duration_estimate_s": inp["duration_estimate_s"],
        "target_audience": "Wrong audience",
        "timeline_segments": [
            {
                "start_s": 0.0,
                "end_s": 10.0,
                "narration_text": "Ever wondered how LLMs process an entire sentence at once.",
                "visual_instruction": inp["visual_beats"][0]["description"],
                "subtitle_text": "Ever wondered how LLMs process an entire sentence at once.",
            },
            {
                "start_s": 10.0,
                "end_s": 20.0,
                "narration_text": "The secret is self-attention.",
                "visual_instruction": inp["visual_beats"][1]["description"],
                "subtitle_text": "The secret is self-attention.",
            },
            {
                "start_s": 20.0,
                "end_s": 30.0,
                "narration_text": "Let's recap the key takeaways.",
                "visual_instruction": inp["visual_beats"][2]["description"],
                "subtitle_text": "Let's recap the key takeaways.",
            },
        ],
    }
    with pytest.raises(TimelineError, match="target_audience was mutated"):
        validate_timeline_draft(draft, inp)


# --- Timeline validation edge cases ---

def test_segment_count_mismatch_fails() -> None:
    inp = _input_obj()
    draft = {
        "topic": inp["topic"],
        "angle": inp["angle"],
        "narration": inp["narration"],
        "visual_beats": inp["visual_beats"],
        "duration_estimate_s": inp["duration_estimate_s"],
        "target_audience": inp["target_audience"],
        "timeline_segments": [
            {
                "start_s": 0.0,
                "end_s": 30.0,
                "narration_text": inp["narration"],
                "visual_instruction": inp["visual_beats"][0]["description"],
                "subtitle_text": inp["narration"],
            },
        ],
    }
    with pytest.raises(TimelineError, match="segment count"):
        validate_timeline_draft(draft, inp)


def test_first_start_s_not_zero_fails() -> None:
    inp = _input_obj()
    segs = inp["visual_beats"]
    draft = {
        "topic": inp["topic"],
        "angle": inp["angle"],
        "narration": inp["narration"],
        "visual_beats": segs,
        "duration_estimate_s": inp["duration_estimate_s"],
        "target_audience": inp["target_audience"],
        "timeline_segments": [
            {
                "start_s": 5.0,
                "end_s": 15.0,
                "narration_text": "Part one.",
                "visual_instruction": segs[0]["description"],
                "subtitle_text": "Part one.",
            },
            {
                "start_s": 15.0,
                "end_s": 25.0,
                "narration_text": "Part two.",
                "visual_instruction": segs[1]["description"],
                "subtitle_text": "Part two.",
            },
            {
                "start_s": 25.0,
                "end_s": 30.0,
                "narration_text": "Part three.",
                "visual_instruction": segs[2]["description"],
                "subtitle_text": "Part three.",
            },
        ],
    }
    with pytest.raises(TimelineError, match="first segment"):
        validate_timeline_draft(draft, inp)


def test_gap_between_segments_fails() -> None:
    inp = _input_obj()
    segs = inp["visual_beats"]
    draft = {
        "topic": inp["topic"],
        "angle": inp["angle"],
        "narration": inp["narration"],
        "visual_beats": segs,
        "duration_estimate_s": inp["duration_estimate_s"],
        "target_audience": inp["target_audience"],
        "timeline_segments": [
            {
                "start_s": 0.0,
                "end_s": 10.0,
                "narration_text": "Part one.",
                "visual_instruction": segs[0]["description"],
                "subtitle_text": "Part one.",
            },
            {
                "start_s": 12.0,
                "end_s": 20.0,
                "narration_text": "Part two.",
                "visual_instruction": segs[1]["description"],
                "subtitle_text": "Part two.",
            },
            {
                "start_s": 20.0,
                "end_s": 30.0,
                "narration_text": "Part three.",
                "visual_instruction": segs[2]["description"],
                "subtitle_text": "Part three.",
            },
        ],
    }
    with pytest.raises(TimelineError, match="does not equal prior end_s"):
        validate_timeline_draft(draft, inp)


def test_narration_text_mismatch_fails() -> None:
    inp = _input_obj()
    segs = inp["visual_beats"]
    draft = {
        "topic": inp["topic"],
        "angle": inp["angle"],
        "narration": inp["narration"],
        "visual_beats": segs,
        "duration_estimate_s": inp["duration_estimate_s"],
        "target_audience": inp["target_audience"],
        "timeline_segments": [
            {
                "start_s": 0.0,
                "end_s": 10.0,
                "narration_text": "Completely different words here.",
                "visual_instruction": segs[0]["description"],
                "subtitle_text": "Completely different words here.",
            },
            {
                "start_s": 10.0,
                "end_s": 20.0,
                "narration_text": "More different words.",
                "visual_instruction": segs[1]["description"],
                "subtitle_text": "More different words.",
            },
            {
                "start_s": 20.0,
                "end_s": 30.0,
                "narration_text": "Even more different.",
                "visual_instruction": segs[2]["description"],
                "subtitle_text": "Even more different.",
            },
        ],
    }
    with pytest.raises(TimelineError, match="narration_text"):
        validate_timeline_draft(draft, inp)


def test_subtitle_text_mismatch_fails() -> None:
    inp = _input_obj()
    segs = inp["visual_beats"]
    draft = {
        "topic": inp["topic"],
        "angle": inp["angle"],
        "narration": inp["narration"],
        "visual_beats": segs,
        "duration_estimate_s": inp["duration_estimate_s"],
        "target_audience": inp["target_audience"],
        "timeline_segments": [
            {
                "start_s": 0.0,
                "end_s": 10.0,
                "narration_text": "Ever wondered how LLMs process an entire sentence at once.",
                "visual_instruction": segs[0]["description"],
                "subtitle_text": "Wrong subtitle",
            },
            {
                "start_s": 10.0,
                "end_s": 20.0,
                "narration_text": "The secret is self-attention.",
                "visual_instruction": segs[1]["description"],
                "subtitle_text": "The secret is self-attention.",
            },
            {
                "start_s": 20.0,
                "end_s": 30.0,
                "narration_text": "Let's recap the key takeaways.",
                "visual_instruction": segs[2]["description"],
                "subtitle_text": "Let's recap the key takeaways.",
            },
        ],
    }
    with pytest.raises(TimelineError, match="subtitle_text"):
        validate_timeline_draft(draft, inp)


def test_visual_instruction_mismatch_fails() -> None:
    inp = _input_obj()
    segs = inp["visual_beats"]
    draft = {
        "topic": inp["topic"],
        "angle": inp["angle"],
        "narration": inp["narration"],
        "visual_beats": segs,
        "duration_estimate_s": inp["duration_estimate_s"],
        "target_audience": inp["target_audience"],
        "timeline_segments": [
            {
                "start_s": 0.0,
                "end_s": 10.0,
                "narration_text": "Ever wondered how LLMs process an entire sentence at once.",
                "visual_instruction": "Wrong description",
                "subtitle_text": "Ever wondered how LLMs process an entire sentence at once.",
            },
            {
                "start_s": 10.0,
                "end_s": 20.0,
                "narration_text": "The secret is self-attention.",
                "visual_instruction": segs[1]["description"],
                "subtitle_text": "The secret is self-attention.",
            },
            {
                "start_s": 20.0,
                "end_s": 30.0,
                "narration_text": "Let's recap the key takeaways.",
                "visual_instruction": segs[2]["description"],
                "subtitle_text": "Let's recap the key takeaways.",
            },
        ],
    }
    with pytest.raises(TimelineError, match="visual_instruction"):
        validate_timeline_draft(draft, inp)


def test_final_end_far_from_duration_fails() -> None:
    inp = _input_obj(duration_estimate_s=60)
    segs = inp["visual_beats"]
    draft = {
        "topic": inp["topic"],
        "angle": inp["angle"],
        "narration": inp["narration"],
        "visual_beats": segs,
        "duration_estimate_s": inp["duration_estimate_s"],
        "target_audience": inp["target_audience"],
        "timeline_segments": [
            {
                "start_s": 0.0,
                "end_s": 10.0,
                "narration_text": "Part one.",
                "visual_instruction": segs[0]["description"],
                "subtitle_text": "Part one.",
            },
            {
                "start_s": 10.0,
                "end_s": 20.0,
                "narration_text": "Part two.",
                "visual_instruction": segs[1]["description"],
                "subtitle_text": "Part two.",
            },
            {
                "start_s": 20.0,
                "end_s": 25.0,
                "narration_text": "Part three.",
                "visual_instruction": segs[2]["description"],
                "subtitle_text": "Part three.",
            },
        ],
    }
    with pytest.raises(TimelineError, match="not within 1s"):
        validate_timeline_draft(draft, inp)


# --- Provider config tests ---

def test_default_model_is_deepseek_v4_pro() -> None:
    from timeline_agent.provider import DEFAULT_MODEL
    assert DEFAULT_MODEL == "deepseek/deepseek-v4-pro"


def test_timeline_model_env_var_respected(monkeypatch: pytest.MonkeyPatch) -> None:
    from timeline_agent.provider import _model
    monkeypatch.setenv("TIMELINE_MODEL", "anthropic/claude-opus-4")
    assert _model() == "anthropic/claude-opus-4"


def test_timeline_temperature_env_var_respected(monkeypatch: pytest.MonkeyPatch) -> None:
    from timeline_agent.provider import _temperature
    monkeypatch.setenv("TIMELINE_TEMPERATURE", "0.5")
    assert _temperature() == 0.5


def test_timeline_temperature_default_is_minimal() -> None:
    from timeline_agent.provider import _temperature
    assert _temperature() == 0.1


# --- Provider error handling ---

def test_provider_model_not_available_fails_fast_with_model_name() -> None:
    import httpx
    from timeline_agent.provider import ProviderError, call_llm

    with mock.patch("timeline_agent.provider.httpx.post") as mock_post:
        mock_resp = mock.MagicMock()
        mock_resp.status_code = 404
        mock_resp.raise_for_status.side_effect = httpx.HTTPStatusError(
            "not found", request=mock.MagicMock(), response=mock_resp
        )
        mock_post.return_value = mock_resp

        with mock.patch("timeline_agent.provider._api_key", return_value="test-key"):
            with pytest.raises(ProviderError, match="model not available.*deepseek"):
                call_llm("test narration", [], 30)


def test_provider_retry_once_on_transient_failure() -> None:
    inp = _input_obj(
        narration="Test narration.",
        visual_beats=[{"timestamp": "0:00", "description": "Beat 1"}],
        duration_estimate_s=30,
    )

    with mock.patch("timeline_agent.timeline.call_llm") as mock_call:
        mock_call.side_effect = [
            ProviderError("transient error"),
            _mock_segments_for("Test narration.", 30),
        ]
        result = generate_timeline(inp)
        assert mock_call.call_count == 2
        assert len(result["timeline_segments"]) == 1


def test_provider_retry_exhausted_raises() -> None:
    with mock.patch("timeline_agent.timeline.call_llm") as mock_call:
        mock_call.side_effect = ProviderError("error1")
        with pytest.raises(TimelineError, match="error1"):
            generate_timeline(_input_obj())
        assert mock_call.call_count == 2


# --- CLI smoke tests ---

def test_cli_timeline_file_exits_zero_with_mock() -> None:
    import tempfile
    from io import StringIO

    from apollo.cli import main

    inp = _input_obj()
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".json", delete=False, encoding="utf-8"
    ) as f:
        json.dump(inp, f)
        tmp_path = f.name

    try:
        with mock.patch(
            "timeline_agent.timeline.call_llm",
            return_value=_mock_segments(),
        ):
            buf = StringIO()
            with mock.patch("sys.stdout", buf):
                rc = main(["timeline", tmp_path])

            assert rc == 0
            output = json.loads(buf.getvalue())
            assert output["topic"] == inp["topic"]
            assert "timeline_segments" in output
            assert len(output["timeline_segments"]) == len(inp["visual_beats"])
    finally:
        os.unlink(tmp_path)


def test_cli_timeline_stdin_exits_zero_with_mock() -> None:
    from io import StringIO

    from apollo.cli import main

    inp = _input_obj()
    with mock.patch(
        "timeline_agent.timeline.call_llm",
        return_value=_mock_segments(),
    ):
        buf = StringIO()
        stdin_buf = StringIO(json.dumps(inp))
        with mock.patch("sys.stdout", buf), mock.patch("sys.stdin", stdin_buf):
            rc = main(["timeline", "-"])

        assert rc == 0
        output = json.loads(buf.getvalue())
        assert "timeline_segments" in output


def test_cli_timeline_malformed_json_in_file_returns_error() -> None:
    import tempfile
    from io import StringIO

    from apollo.cli import main

    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".json", delete=False, encoding="utf-8"
    ) as f:
        f.write("not valid json {{{")
        tmp_path = f.name

    try:
        buf = StringIO()
        with mock.patch("sys.stderr", buf):
            rc = main(["timeline", tmp_path])

        assert rc == 1
        assert "malformed" in buf.getvalue().lower()
    finally:
        os.unlink(tmp_path)


def test_cli_timeline_missing_required_field_returns_error() -> None:
    import tempfile
    from io import StringIO

    from apollo.cli import main

    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".json", delete=False, encoding="utf-8"
    ) as f:
        json.dump({"topic": "no other fields"}, f)
        tmp_path = f.name

    try:
        buf = StringIO()
        with mock.patch("sys.stderr", buf):
            rc = main(["timeline", tmp_path])

        assert rc == 1
        assert "missing required fields" in buf.getvalue().lower()
    finally:
        os.unlink(tmp_path)


def test_cli_timeline_nonexistent_file_returns_error() -> None:
    from io import StringIO

    from apollo.cli import main

    buf = StringIO()
    with mock.patch("sys.stderr", buf):
        rc = main(["timeline", "/nonexistent/path.json"])

    assert rc == 1
    assert "file not found" in buf.getvalue().lower()


def test_cli_command_help_lists_timeline() -> None:
    result = subprocess.run(
        [sys.executable, "-m", "apollo", "--help"],
        cwd=ROOT,
        env=_cli_env(),
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0
    assert "timeline" in result.stdout


# --- Pipeline integration: script output pipes into timeline ---

def test_script_output_is_valid_timeline_input() -> None:
    """Verify that script_agent output shape is accepted by timeline_agent."""
    script_output = {
        "topic": "How Attention Works",
        "angle": "Key-value lookup analogy",
        "narration": "This is a test narration for the timeline agent.",
        "visual_beats": [
            {"timestamp": "0:00", "description": "Title card"},
            {"timestamp": "0:10", "description": "Diagram"},
        ],
        "duration_estimate_s": 20,
        "target_audience": "software developers preparing for technical interviews",
    }

    with mock.patch(
        "timeline_agent.timeline.call_llm",
        return_value=TimelineDraftRaw(
            timeline_segments=[
                TimelineSegmentRaw(0.0, 10.0, "This is a test narration", "This is a test narration"),
                TimelineSegmentRaw(10.0, 20.0, "for the timeline agent.", "for the timeline agent."),
            ]
        ),
    ):
        result = generate_timeline(script_output)

    assert result["topic"] == script_output["topic"]
    assert "timeline_segments" in result
    assert len(result["timeline_segments"]) == 2


# --- Narration preservation with whitespace normalization ---

def test_narration_preservation_with_extra_whitespace() -> None:
    """Narration with multiple spaces/newlines should still match after normalization."""
    inp = _input_obj(
        narration="Ever   wondered how LLMs\nprocess  an  entire sentence at once.  "
                   "The secret is self-attention.  Let's recap the key takeaways."
    )
    with mock.patch(
        "timeline_agent.timeline.call_llm",
        return_value=_mock_segments(),
    ):
        result = generate_timeline(inp)

    concat = " ".join(seg["narration_text"] for seg in result["timeline_segments"])
    assert " ".join(concat.split()) == " ".join(str(inp["narration"]).split())


# --- Non-monotonic / negative-duration segment validation ---

def test_negative_duration_segment_fails_validation() -> None:
    """end_s <= start_s should fail."""
    inp = _input_obj()
    segs = inp["visual_beats"]
    draft = {
        "topic": inp["topic"],
        "angle": inp["angle"],
        "narration": inp["narration"],
        "visual_beats": segs,
        "duration_estimate_s": inp["duration_estimate_s"],
        "target_audience": inp["target_audience"],
        "timeline_segments": [
            {
                "start_s": 0.0,
                "end_s": 10.0,
                "narration_text": "Ever wondered how LLMs process an entire sentence at once.",
                "visual_instruction": segs[0]["description"],
                "subtitle_text": "Ever wondered how LLMs process an entire sentence at once.",
            },
            {
                "start_s": 10.0,
                "end_s": 5.0,
                "narration_text": "The secret is self-attention.",
                "visual_instruction": segs[1]["description"],
                "subtitle_text": "The secret is self-attention.",
            },
            {
                "start_s": 5.0,
                "end_s": 30.0,
                "narration_text": "Let's recap the key takeaways.",
                "visual_instruction": segs[2]["description"],
                "subtitle_text": "Let's recap the key takeaways.",
            },
        ],
    }
    with pytest.raises(TimelineError, match="non-positive duration"):
        validate_timeline_draft(draft, inp)


def test_zero_duration_segment_fails_validation() -> None:
    """end_s == start_s should fail."""
    inp = _input_obj()
    segs = inp["visual_beats"]
    draft = {
        "topic": inp["topic"],
        "angle": inp["angle"],
        "narration": inp["narration"],
        "visual_beats": segs,
        "duration_estimate_s": inp["duration_estimate_s"],
        "target_audience": inp["target_audience"],
        "timeline_segments": [
            {
                "start_s": 0.0,
                "end_s": 0.0,
                "narration_text": "Ever wondered how LLMs process an entire sentence at once.",
                "visual_instruction": segs[0]["description"],
                "subtitle_text": "Ever wondered how LLMs process an entire sentence at once.",
            },
            {
                "start_s": 0.0,
                "end_s": 10.0,
                "narration_text": "The secret is self-attention.",
                "visual_instruction": segs[1]["description"],
                "subtitle_text": "The secret is self-attention.",
            },
            {
                "start_s": 10.0,
                "end_s": 30.0,
                "narration_text": "Let's recap the key takeaways.",
                "visual_instruction": segs[2]["description"],
                "subtitle_text": "Let's recap the key takeaways.",
            },
        ],
    }
    with pytest.raises(TimelineError, match="non-positive duration"):
        validate_timeline_draft(draft, inp)


# --- Too many LLM segments before injection (IndexError → TimelineError) ---

def test_too_many_segments_raises_before_injection() -> None:
    """LLM returns more segments than beats → TimelineError, not IndexError."""
    inp = _input_obj()  # 3 beats
    with mock.patch(
        "timeline_agent.timeline.call_llm",
        return_value=TimelineDraftRaw(
            timeline_segments=[
                TimelineSegmentRaw(0.0, 5.0, "A.", "A."),
                TimelineSegmentRaw(5.0, 10.0, "B.", "B."),
                TimelineSegmentRaw(10.0, 15.0, "C.", "C."),
                TimelineSegmentRaw(15.0, 30.0, "D.", "D."),
            ]
        ),
    ):
        with pytest.raises(TimelineError, match="segment count"):
            generate_timeline(inp)


# --- Top-level extra fields in LLM response rejected ---

def test_provider_extra_top_level_fields_rejected() -> None:
    """LLM response with fields beyond timeline_segments should fail."""
    from timeline_agent.provider import _parse_response

    raw = json.dumps({"timeline_segments": [
        {"start_s": 0.0, "end_s": 10.0, "narration_text": "Test.", "subtitle_text": "Test."}
    ], "extra_field": "should not be here"})
    with pytest.raises(ProviderError, match="unexpected top-level fields"):
        _parse_response(raw)


# --- No-retry on ModelNotAvailableError ---

def test_model_not_available_is_not_retried() -> None:
    """ModelNotAvailableError must fail fast without retry."""
    with mock.patch("timeline_agent.timeline.call_llm") as mock_call:
        mock_call.side_effect = ModelNotAvailableError("model not available: bad-model")
        with pytest.raises(TimelineError, match="model not available"):
            generate_timeline(_input_obj())
        assert mock_call.call_count == 1


# --- Mutated passthrough: topic, angle, visual_beats, duration_estimate_s ---

def test_mutated_topic_fails_validation() -> None:
    inp = _input_obj()
    draft = {
        "topic": "Wrong topic",
        "angle": inp["angle"],
        "narration": inp["narration"],
        "visual_beats": inp["visual_beats"],
        "duration_estimate_s": inp["duration_estimate_s"],
        "target_audience": inp["target_audience"],
        "timeline_segments": [
            {
                "start_s": 0.0,
                "end_s": 10.0,
                "narration_text": "Ever wondered how LLMs process an entire sentence at once.",
                "visual_instruction": inp["visual_beats"][0]["description"],
                "subtitle_text": "Ever wondered how LLMs process an entire sentence at once.",
            },
            {
                "start_s": 10.0,
                "end_s": 20.0,
                "narration_text": "The secret is self-attention.",
                "visual_instruction": inp["visual_beats"][1]["description"],
                "subtitle_text": "The secret is self-attention.",
            },
            {
                "start_s": 20.0,
                "end_s": 30.0,
                "narration_text": "Let's recap the key takeaways.",
                "visual_instruction": inp["visual_beats"][2]["description"],
                "subtitle_text": "Let's recap the key takeaways.",
            },
        ],
    }
    with pytest.raises(TimelineError, match="topic was mutated"):
        validate_timeline_draft(draft, inp)


def test_mutated_angle_fails_validation() -> None:
    inp = _input_obj()
    draft = {
        "topic": inp["topic"],
        "angle": "Wrong angle",
        "narration": inp["narration"],
        "visual_beats": inp["visual_beats"],
        "duration_estimate_s": inp["duration_estimate_s"],
        "target_audience": inp["target_audience"],
        "timeline_segments": [
            {
                "start_s": 0.0,
                "end_s": 10.0,
                "narration_text": "Ever wondered how LLMs process an entire sentence at once.",
                "visual_instruction": inp["visual_beats"][0]["description"],
                "subtitle_text": "Ever wondered how LLMs process an entire sentence at once.",
            },
            {
                "start_s": 10.0,
                "end_s": 20.0,
                "narration_text": "The secret is self-attention.",
                "visual_instruction": inp["visual_beats"][1]["description"],
                "subtitle_text": "The secret is self-attention.",
            },
            {
                "start_s": 20.0,
                "end_s": 30.0,
                "narration_text": "Let's recap the key takeaways.",
                "visual_instruction": inp["visual_beats"][2]["description"],
                "subtitle_text": "Let's recap the key takeaways.",
            },
        ],
    }
    with pytest.raises(TimelineError, match="angle was mutated"):
        validate_timeline_draft(draft, inp)


def test_mutated_visual_beats_timestamp_fails_validation() -> None:
    inp = _input_obj()
    mutated_beats = [
        {"timestamp": "9:99", "description": inp["visual_beats"][0]["description"]},
        inp["visual_beats"][1],
        inp["visual_beats"][2],
    ]
    draft = {
        "topic": inp["topic"],
        "angle": inp["angle"],
        "narration": inp["narration"],
        "visual_beats": mutated_beats,
        "duration_estimate_s": inp["duration_estimate_s"],
        "target_audience": inp["target_audience"],
        "timeline_segments": [
            {
                "start_s": 0.0,
                "end_s": 10.0,
                "narration_text": "Ever wondered how LLMs process an entire sentence at once.",
                "visual_instruction": inp["visual_beats"][0]["description"],
                "subtitle_text": "Ever wondered how LLMs process an entire sentence at once.",
            },
            {
                "start_s": 10.0,
                "end_s": 20.0,
                "narration_text": "The secret is self-attention.",
                "visual_instruction": inp["visual_beats"][1]["description"],
                "subtitle_text": "The secret is self-attention.",
            },
            {
                "start_s": 20.0,
                "end_s": 30.0,
                "narration_text": "Let's recap the key takeaways.",
                "visual_instruction": inp["visual_beats"][2]["description"],
                "subtitle_text": "Let's recap the key takeaways.",
            },
        ],
    }
    with pytest.raises(TimelineError, match="timestamp was mutated"):
        validate_timeline_draft(draft, inp)


def test_visual_beats_not_a_list_fails_validation() -> None:
    """visual_beats passthrough is not a list → passthrough error."""
    inp = _input_obj()
    draft = {
        "topic": inp["topic"],
        "angle": inp["angle"],
        "narration": inp["narration"],
        "visual_beats": "not a list",
        "duration_estimate_s": inp["duration_estimate_s"],
        "target_audience": inp["target_audience"],
        "timeline_segments": [
            {
                "start_s": 0.0,
                "end_s": 10.0,
                "narration_text": "Ever wondered how LLMs process an entire sentence at once.",
                "visual_instruction": inp["visual_beats"][0]["description"],
                "subtitle_text": "Ever wondered how LLMs process an entire sentence at once.",
            },
            {
                "start_s": 10.0,
                "end_s": 20.0,
                "narration_text": "The secret is self-attention.",
                "visual_instruction": inp["visual_beats"][1]["description"],
                "subtitle_text": "The secret is self-attention.",
            },
            {
                "start_s": 20.0,
                "end_s": 30.0,
                "narration_text": "Let's recap the key takeaways.",
                "visual_instruction": inp["visual_beats"][2]["description"],
                "subtitle_text": "Let's recap the key takeaways.",
            },
        ],
    }
    with pytest.raises(TimelineError, match="visual_beats passthrough mismatch"):
        validate_timeline_draft(draft, inp)


def test_mutated_duration_estimate_fails_validation() -> None:
    inp = _input_obj()
    draft = {
        "topic": inp["topic"],
        "angle": inp["angle"],
        "narration": inp["narration"],
        "visual_beats": inp["visual_beats"],
        "duration_estimate_s": 999,
        "target_audience": inp["target_audience"],
        "timeline_segments": [
            {
                "start_s": 0.0,
                "end_s": 10.0,
                "narration_text": "Ever wondered how LLMs process an entire sentence at once.",
                "visual_instruction": inp["visual_beats"][0]["description"],
                "subtitle_text": "Ever wondered how LLMs process an entire sentence at once.",
            },
            {
                "start_s": 10.0,
                "end_s": 20.0,
                "narration_text": "The secret is self-attention.",
                "visual_instruction": inp["visual_beats"][1]["description"],
                "subtitle_text": "The secret is self-attention.",
            },
            {
                "start_s": 20.0,
                "end_s": 30.0,
                "narration_text": "Let's recap the key takeaways.",
                "visual_instruction": inp["visual_beats"][2]["description"],
                "subtitle_text": "Let's recap the key takeaways.",
            },
        ],
    }
    with pytest.raises(TimelineError, match="duration_estimate_s was mutated"):
        validate_timeline_draft(draft, inp)
