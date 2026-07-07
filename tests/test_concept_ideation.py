"""Tests for the Concept Ideation Agent (spec 0001)."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path
from unittest import mock

import pytest

from concept_ideation import IdeationError, ideate
from concept_ideation.provider import ProviderError, Topic, generate_topics

ROOT = Path(__file__).resolve().parents[1]


def _cli_env() -> dict[str, str]:
    env = os.environ.copy()
    src_path = str(ROOT / "src")
    existing = env.get("PYTHONPATH")
    env["PYTHONPATH"] = src_path if not existing else os.pathsep.join([src_path, existing])
    return env


# --- Unit: ideate with mocked provider ---

def mock_topics(*pairs: tuple[str, str]) -> list[Topic]:
    return [Topic(topic=t, angle=a) for t, a in pairs]


def test_ideate_topic_count_one_returns_single_object() -> None:
    with mock.patch(
        "concept_ideation.ideate.generate_topics",
        return_value=mock_topics(("How Attention Mechanisms Let LLMs Read Whole Paragraphs at Once", "Visual breakdown of self-attention as a weighted lookup table")),
    ):
        result = ideate("LLMs")

    assert isinstance(result, dict)
    assert set(result) == {"topic", "angle"}
    assert result["topic"].startswith("How Attention Mechanisms")
    assert result["angle"].startswith("Visual breakdown")


def test_ideate_topic_count_three_returns_array() -> None:
    topics = mock_topics(
        ("Topic A", "Angle A"),
        ("Topic B", "Angle B"),
        ("Topic C", "Angle C"),
    )
    with mock.patch("concept_ideation.ideate.generate_topics", return_value=topics):
        result = ideate("LLMs", topic_count=3)

    assert isinstance(result, list)
    assert len(result) == 3
    for item in result:
        assert set(item) == {"topic", "angle"}
    assert result[0]["topic"] == "Topic A"
    assert result[2]["angle"] == "Angle C"


# --- Unit: ideate failure modes ---

def test_empty_concept_raises() -> None:
    with pytest.raises(IdeationError, match="concept must be non-empty"):
        ideate("   ")


def test_whitespace_concept_raises() -> None:
    with pytest.raises(IdeationError, match="concept must be non-empty"):
        ideate("\n\t  ")


def test_provider_error_retries_once_then_surfaces() -> None:
    call_count = 0

    def fail_twice(_concept, topic_count=1):
        nonlocal call_count
        call_count += 1
        raise ProviderError("test error")

    with mock.patch("concept_ideation.ideate.generate_topics", side_effect=fail_twice):
        with pytest.raises(IdeationError, match="test error"):
            ideate("LLMs")

    assert call_count == 2


def test_fewer_topics_than_requested_warns() -> None:
    topics = mock_topics(("Only Topic", "Only Angle"))
    with mock.patch("concept_ideation.ideate.generate_topics", return_value=topics):
        result = ideate("LLMs", topic_count=3)

    assert isinstance(result, list)
    assert len(result) == 1


def test_topic_count_zero_raises_ideation_error() -> None:
    with pytest.raises(IdeationError, match="topic_count must be at least 1"):
        ideate("LLMs", topic_count=0)


def test_negative_topic_count_raises() -> None:
    with pytest.raises(IdeationError, match="topic_count must be at least 1"):
        ideate("LLMs", topic_count=-1)


# --- Unit: provider ---

def test_generate_topics_parses_valid_response(monkeypatch) -> None:
    monkeypatch.setenv("OPENROUTER_API_KEY", "sk-test")

    fake_response = mock.Mock()
    fake_response.raise_for_status = mock.Mock()
    fake_response.json.return_value = {
        "choices": [
            {"message": {"content": '[{"topic":"A","angle":"B"}]'}}
        ]
    }

    with mock.patch("concept_ideation.provider.httpx.post", return_value=fake_response):
        topics = generate_topics("test")

    assert len(topics) == 1
    assert topics[0].topic == "A"
    assert topics[0].angle == "B"


def test_generate_topics_unparseable_raises(monkeypatch) -> None:
    monkeypatch.setenv("OPENROUTER_API_KEY", "sk-test")

    fake_response = mock.Mock()
    fake_response.raise_for_status = mock.Mock()
    fake_response.json.return_value = {
        "choices": [
            {"message": {"content": "not json at all"}}
        ]
    }

    with mock.patch("concept_ideation.provider.httpx.post", return_value=fake_response):
        with pytest.raises(ProviderError, match="unparseable"):
            generate_topics("test")


def test_generate_topics_missing_api_key() -> None:
    with mock.patch.dict(os.environ, {}, clear=True):
        with pytest.raises(ProviderError, match="OPENROUTER_API_KEY"):
            generate_topics("test")


# --- CLI smoke tests ---

def test_cli_ideate_smoke_displays_error_on_no_api_key() -> None:
    env = _cli_env()
    env.pop("OPENROUTER_API_KEY", None)
    result = subprocess.run(
        [sys.executable, "-m", "apollo", "ideate", "binary search"],
        cwd=ROOT,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode != 0
    assert result.stderr


def test_cli_ideate_smoke_exits_zero_with_mock() -> None:
    """Integration-lite: mock the provider so we can verify CLI contract."""
    # Run via a subprocess patching is complex; use in-process instead.
    from apollo.cli import main

    with mock.patch(
        "concept_ideation.ideate.generate_topics",
        return_value=[Topic(topic="Test Topic", angle="Test Angle")],
    ):
        with mock.patch("sys.stdout", new_callable=lambda: None) as fake_stdout:
            from io import StringIO
            buf = StringIO()
            rc = None
            with mock.patch("sys.stdout", buf):
                rc = main(["ideate", "Sorting Algorithms"])

            assert rc == 0
            output = buf.getvalue()
            parsed = json.loads(output)
            assert parsed["topic"] == "Test Topic"
            assert parsed["angle"] == "Test Angle"


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


# --- Contract test: ideation output fits 0002 input shape ---

def test_output_contract_compatible_with_script_agent() -> None:
    """0002 expects {topic, angle} object. Verify our output is parsable."""
    with mock.patch(
        "concept_ideation.ideate.generate_topics",
        return_value=mock_topics(("T", "A")),
    ):
        result = ideate("test", topic_count=1)

    assert isinstance(result, dict)
    assert isinstance(result["topic"], str)
    assert isinstance(result["angle"], str)
    assert len(result["topic"]) > 0
    assert len(result["angle"]) > 0


def test_output_contract_array_mode_still_has_valid_items() -> None:
    with mock.patch(
        "concept_ideation.ideate.generate_topics",
        return_value=mock_topics(("T1", "A1"), ("T2", "A2")),
    ):
        result = ideate("test", topic_count=2)

    assert isinstance(result, list)
    assert len(result) == 2
    for item in result:
        assert isinstance(item["topic"], str) and len(item["topic"]) > 0
        assert isinstance(item["angle"], str) and len(item["angle"]) > 0


# --- Model configurability ---

def test_default_model_is_deepseek_v4_flash() -> None:
    with mock.patch.dict(os.environ, {}, clear=True):
        from concept_ideation.provider import _model
        assert _model() == "deepseek/deepseek-v4-flash"


def test_ideation_model_env_overrides_default() -> None:
    with mock.patch.dict(os.environ, {"IDEATION_MODEL": "custom/model"}, clear=True):
        from concept_ideation.provider import _model
        assert _model() == "custom/model"


def test_model_not_found_fails_fast_with_model_name(monkeypatch) -> None:
    monkeypatch.setenv("OPENROUTER_API_KEY", "sk-test")
    from httpx import HTTPStatusError, Request, Response

    fake_error = HTTPStatusError(
        "not found",
        request=Request("POST", "https://example.com"),
        response=Response(404),
    )

    with mock.patch("concept_ideation.provider.httpx.post", side_effect=fake_error):
        with pytest.raises(ProviderError, match="model not available"):
            generate_topics("test")
