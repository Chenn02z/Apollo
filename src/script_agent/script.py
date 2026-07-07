"""Core script logic: parse input, call LLM, return structured output."""

from __future__ import annotations

import sys
from typing import Any

from .provider import ProviderError, call_llm


class ScriptError(Exception):
    """Expected script generation failure."""


def _validate_topic(topic: object) -> str:
    if not isinstance(topic, str) or not topic.strip():
        raise ScriptError("topic must be a non-empty string")
    return topic.strip()


def generate_script(input_obj: dict[str, str]) -> dict[str, Any]:
    """Generate a script package from a {topic, angle} input.

    Args:
        input_obj: Dict with required 'topic' key and optional 'angle' key.

    Returns:
        A dict representing the script package.

    Raises:
        ScriptError: For invalid input or generation failure.
    """
    if not isinstance(input_obj, dict):
        raise ScriptError("input must be a JSON object")

    topic = input_obj.get("topic")
    if topic is None:
        raise ScriptError("input must contain a 'topic' field")
    topic = _validate_topic(topic)

    angle_seed = input_obj.get("angle")
    if angle_seed is not None and (not isinstance(angle_seed, str) or not angle_seed.strip()):
        raise ScriptError("angle must be a non-empty string if provided")

    try:
        pkg = call_llm(topic, angle_seed)
    except ProviderError:
        # Retry once
        try:
            pkg = call_llm(topic, angle_seed)
        except ProviderError as exc:
            raise ScriptError(str(exc)) from exc

    min_dur = 60
    max_dur = 90
    if pkg.duration_estimate_s < min_dur or pkg.duration_estimate_s > max_dur:
        print(
            f"warning: duration estimate {pkg.duration_estimate_s}s outside "
            f"{min_dur}-{max_dur}s range",
            file=sys.stderr,
        )

    return {
        "topic": topic,
        "angle": pkg.angle,
        "narration": pkg.narration,
        "visual_beats": [
            {"timestamp": vb.timestamp, "description": vb.description}
            for vb in pkg.visual_beats
        ],
        "duration_estimate_s": pkg.duration_estimate_s,
        "target_audience": pkg.target_audience,
    }
