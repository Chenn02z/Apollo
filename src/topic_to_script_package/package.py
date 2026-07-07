"""Deterministic script-package generation for topic-only intake."""

from __future__ import annotations

from typing import Any


class TopicToScriptError(ValueError):
    """Base error for expected topic-to-script-package failures."""


class EmptyTopicError(TopicToScriptError):
    """Raised when the topic is empty after trimming whitespace."""


class BroadTopicError(TopicToScriptError):
    """Raised when a topic is too broad for one short-form clip."""


class NoUsableAngleError(TopicToScriptError):
    """Raised when a topic is not broad but no single concrete angle can be chosen."""


class GenerationError(TopicToScriptError):
    """Raised when the generated package does not satisfy the v1 contract."""


BROAD_TOPICS = {
    "artificial intelligence",
    "algorithms",
    "computer science",
    "cybersecurity",
    "data structures",
    "databases",
    "machine learning",
    "mathematics",
    "networking",
    "physics",
    "programming",
    "software engineering",
    "web development",
}
SURVEY_MARKERS = {
    "all about",
    "basics",
    "beginner guide",
    "complete guide",
    "ecosystem",
    "everything about",
    "fundamentals",
    "guide to",
    "history of",
    "intro to",
    "introduction to",
    "landscape",
    "overview",
    "overview of",
    "roadmap",
    "survey of",
    "toolchain",
}
LIST_SEPARATORS = (",", ";", " / ", " & ")

UNANGLEABLE_WORDS = {"all", "anything", "everything", "nothing", "stuff", "things"}

TOP_LEVEL_KEYS = {
    "schema_version",
    "topic",
    "selected_clip_angle",
    "target_duration_seconds",
    "voiceover_script",
    "visual_beats",
}
ANGLE_KEYS = {"title", "teaching_goal"}
BEAT_KEYS = {"id", "sequence", "goal", "script_span", "visual_intent"}
SPAN_KEYS = {"start_char", "end_char"}


def validate_topic(topic: str) -> str:
    trimmed = topic.strip()
    if not trimmed:
        raise EmptyTopicError("topic must be non-empty")

    normalized = " ".join(trimmed.casefold().split())
    if _is_unusable_broad_topic(normalized):
        raise BroadTopicError(
            "topic is too broad for one 60-90 second technical education clip"
        )
    return trimmed


def build_script_package(topic: str) -> dict[str, Any]:
    clean_topic = validate_topic(topic)
    if _is_unangleable_topic(" ".join(clean_topic.casefold().split())):
        raise NoUsableAngleError(
            f"cannot select a single concrete teaching angle for '{clean_topic}'"
        )
    angle = _select_angle(clean_topic)
    script_segments = _build_script_segments(clean_topic)
    voiceover_script = "".join(script_segments)
    visual_beats = _build_visual_beats(script_segments, clean_topic)

    package = {
        "schema_version": "script-package.v1",
        "topic": topic,
        "selected_clip_angle": angle,
        "target_duration_seconds": 75,
        "voiceover_script": voiceover_script,
        "visual_beats": visual_beats,
    }
    _validate_package(package)
    return package


def _select_angle(topic: str) -> dict[str, str]:
    return {
        "title": f"{topic}: the decision rule that makes it work",
        "teaching_goal": (
            f"Show the viewer the core decision behind {topic} and how to apply "
            "it without memorizing steps."
        ),
    }


def _build_script_segments(topic: str) -> list[str]:
    return [
        (
            f"{topic} is easiest to learn when you stop treating it like a list "
            "of steps and look for the decision it repeats. "
        ),
        (
            "Start with the full problem in view, then ask one question that "
            "cuts away the part that cannot contain the answer. "
        ),
        (
            "After each cut, the remaining space is smaller, but the same rule "
            "still applies, so you do not need a new strategy. "
        ),
        (
            "The common mistake is moving forward mechanically without checking "
            "which side the evidence actually points to. "
        ),
        (
            f"Use {topic} well by naming the invariant, making one justified "
            "cut, and repeating until only the answer-shaped space remains."
        ),
    ]


def _build_visual_beats(
    script_segments: list[str], topic: str
) -> list[dict[str, Any]]:
    goals = [
        "Introduce the repeated decision behind the concept.",
        "Show the first narrowing move from the full problem.",
        "Reinforce that the same rule survives each smaller state.",
        "Call out the main misconception before the final summary.",
        "Summarize the usable takeaway as a compact checklist.",
    ]
    visual_intents = [
        f"Show the phrase {topic} beside one highlighted repeated decision.",
        "Show a full problem space with the impossible region set aside.",
        "Show the remaining space shrinking while the rule label stays fixed.",
        "Show an incorrect mechanical step contrasted with an evidence check.",
        "Show three ordered labels: invariant, justified cut, answer space.",
    ]

    beats: list[dict[str, Any]] = []
    start = 0
    for index, segment in enumerate(script_segments, start=1):
        end = start + len(segment)
        beats.append(
            {
                "id": f"beat-{index:03d}",
                "sequence": index,
                "goal": goals[index - 1],
                "script_span": {"start_char": start, "end_char": end},
                "visual_intent": visual_intents[index - 1],
            }
        )
        start = end
    return beats


def _is_unusable_broad_topic(normalized_topic: str) -> bool:
    if normalized_topic in BROAD_TOPICS:
        return True
    if any(marker in normalized_topic for marker in SURVEY_MARKERS):
        return True
    if any(separator in normalized_topic for separator in LIST_SEPARATORS):
        return True

    if " and " in normalized_topic:
        parts = [part.strip() for part in normalized_topic.split(" and ")]
        if len(parts) > 1 and all(part for part in parts):
            return True
    return False


def _is_unangleable_topic(normalized_topic: str) -> bool:
    return normalized_topic in UNANGLEABLE_WORDS


def _validate_package(package: dict[str, Any]) -> None:
    if set(package) != TOP_LEVEL_KEYS:
        raise GenerationError("script package has invalid top-level fields")
    if package["schema_version"] != "script-package.v1":
        raise GenerationError("script package has invalid schema version")
    if not _non_empty(package["topic"]):
        raise GenerationError("script package topic is empty")
    if not 60 <= package["target_duration_seconds"] <= 90:
        raise GenerationError("target duration is outside 60-90 seconds")

    angle = package["selected_clip_angle"]
    if not isinstance(angle, dict) or set(angle) != ANGLE_KEYS:
        raise GenerationError("selected clip angle has invalid fields")
    if not _non_empty(angle["title"]) or not _non_empty(angle["teaching_goal"]):
        raise GenerationError("selected clip angle is empty")

    script = package["voiceover_script"]
    if not _non_empty(script):
        raise GenerationError("voiceover script is empty")

    beats = package["visual_beats"]
    if not isinstance(beats, list) or not beats:
        raise GenerationError("visual beats are empty")

    expected_start = 0
    reconstructed = ""
    for expected_sequence, beat in enumerate(beats, start=1):
        if not isinstance(beat, dict) or set(beat) != BEAT_KEYS:
            raise GenerationError("visual beat has invalid fields")
        if beat["sequence"] != expected_sequence:
            raise GenerationError("visual beat sequence is invalid")
        if beat["id"] != f"beat-{expected_sequence:03d}":
            raise GenerationError("visual beat id is invalid")
        if not _non_empty(beat["goal"]) or not _non_empty(beat["visual_intent"]):
            raise GenerationError("visual beat text is empty")

        span = beat["script_span"]
        if not isinstance(span, dict) or set(span) != SPAN_KEYS:
            raise GenerationError("script span has invalid fields")
        start = span["start_char"]
        end = span["end_char"]
        if not isinstance(start, int) or not isinstance(end, int):
            raise GenerationError("script span offsets must be integers")
        if start != expected_start or end <= start or end > len(script):
            raise GenerationError("script spans do not cover the script in order")
        reconstructed += script[start:end]
        expected_start = end

    if expected_start != len(script) or reconstructed != script:
        raise GenerationError("visual beat spans do not reconstruct the script")


def _non_empty(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())
