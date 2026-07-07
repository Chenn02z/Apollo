from __future__ import annotations

import json
import os
import subprocess
import sys
import tomllib
from pathlib import Path

import pytest

from topic_to_script_package import (
    BroadTopicError,
    EmptyTopicError,
    GenerationError,
    NoUsableAngleError,
    build_script_package,
    validate_topic,
)


ROOT = Path(__file__).resolve().parents[1]


def _cli_env() -> dict[str, str]:
    env = os.environ.copy()
    src_path = str(ROOT / "src")
    existing = env.get("PYTHONPATH")
    env["PYTHONPATH"] = src_path if not existing else os.pathsep.join([src_path, existing])
    return env


def test_empty_or_whitespace_topic_fails_validation() -> None:
    with pytest.raises(EmptyTopicError):
        validate_topic("   \n\t  ")


@pytest.mark.parametrize(
    "topic",
    [
        "computer science",
        "overview of machine learning",
        "python web development toolchain",
        "algorithms and data structures",
        "programming basics",
        "databases, networking",
    ],
)
def test_broad_or_ambiguous_topic_fails_validation(topic: str) -> None:
    with pytest.raises(BroadTopicError):
        validate_topic(topic)


def test_success_preserves_original_topic_string() -> None:
    raw_topic = "  binary search  "

    package = build_script_package(raw_topic)

    assert package["topic"] == raw_topic
    assert package["voiceover_script"].startswith("binary search is")


def test_successful_narrow_topic_yields_exact_contract() -> None:
    package = build_script_package("binary search")

    assert set(package) == {
        "schema_version",
        "topic",
        "selected_clip_angle",
        "target_duration_seconds",
        "voiceover_script",
        "visual_beats",
    }
    assert package["schema_version"] == "script-package.v1"
    assert package["topic"] == "binary search"
    assert 60 <= package["target_duration_seconds"] <= 90
    assert set(package["selected_clip_angle"]) == {"title", "teaching_goal"}
    assert package["selected_clip_angle"]["title"].strip()
    assert package["selected_clip_angle"]["teaching_goal"].strip()
    assert package["voiceover_script"].strip()
    assert package["visual_beats"]

    for beat in package["visual_beats"]:
        assert set(beat) == {
            "id",
            "sequence",
            "goal",
            "script_span",
            "visual_intent",
        }
        assert set(beat["script_span"]) == {"start_char", "end_char"}
        assert beat["goal"].strip()
        assert beat["visual_intent"].strip()


def test_visual_beats_cover_and_reconstruct_full_script() -> None:
    package = build_script_package("binary search")
    script = package["voiceover_script"]
    expected_start = 0
    reconstructed = ""

    for expected_sequence, beat in enumerate(package["visual_beats"], start=1):
        assert beat["sequence"] == expected_sequence
        span = beat["script_span"]
        assert span["start_char"] == expected_start
        assert span["end_char"] > span["start_char"]
        assert span["end_char"] <= len(script)
        reconstructed += script[span["start_char"] : span["end_char"]]
        expected_start = span["end_char"]

    assert expected_start == len(script)
    assert reconstructed == script


def test_cli_smoke_success_stdout_contains_only_json() -> None:
    result = subprocess.run(
        [sys.executable, "-m", "topic_to_script_package", "binary search"],
        cwd=ROOT,
        env=_cli_env(),
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0
    assert result.stderr == ""
    assert result.stdout
    package = json.loads(result.stdout)
    assert package["schema_version"] == "script-package.v1"
    assert result.stdout == json.dumps(
        package, ensure_ascii=False, separators=(",", ":")
    )


def test_cli_empty_topic_failure_has_empty_stdout() -> None:
    result = subprocess.run(
        [sys.executable, "-m", "topic_to_script_package", "   "],
        cwd=ROOT,
        env=_cli_env(),
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode != 0
    assert result.stdout == ""
    assert result.stderr


def test_cli_broad_topic_failure_has_empty_stdout() -> None:
    result = subprocess.run(
        [sys.executable, "-m", "topic_to_script_package", "computer science"],
        cwd=ROOT,
        env=_cli_env(),
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode != 0
    assert result.stdout == ""
    assert result.stderr


@pytest.mark.parametrize("topic", ["everything", "nothing", "stuff", "things"])
def test_unangleable_topic_fails_validation(topic: str) -> None:
    with pytest.raises(NoUsableAngleError):
        build_script_package(topic)


def test_generation_failure_raised_on_corrupt_package(monkeypatch) -> None:
    def corrupt_angle(_topic: str) -> dict[str, str]:
        return {"title": "", "teaching_goal": ""}

    monkeypatch.setattr(
        "topic_to_script_package.package._select_angle", corrupt_angle
    )
    with pytest.raises(GenerationError):
        build_script_package("binary search")


def test_cli_unangleable_topic_fails() -> None:
    result = subprocess.run(
        [sys.executable, "-m", "topic_to_script_package", "everything"],
        cwd=ROOT,
        env=_cli_env(),
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode != 0
    assert result.stdout == ""
    assert result.stderr


def test_project_exposes_required_cli_command() -> None:
    pyproject = tomllib.loads((ROOT / "pyproject.toml").read_text())

    assert pyproject["project"]["scripts"]["topic-to-script-package"] == (
        "topic_to_script_package.cli:main"
    )
