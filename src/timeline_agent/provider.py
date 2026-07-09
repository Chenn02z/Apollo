"""OpenRouter provider for the Timeline Agent.

Single LLM call per run using deepseek/deepseek-v4-pro (configurable via
TIMELINE_MODEL / TIMELINE_TEMPERATURE).
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field

import httpx

DEFAULT_MODEL = "deepseek/deepseek-v4-pro"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


@dataclass(frozen=True)
class TimelineSegmentRaw:
    start_s: float
    end_s: float
    narration_text: str
    subtitle_text: str


@dataclass(frozen=True)
class TimelineDraftRaw:
    timeline_segments: list[TimelineSegmentRaw]


class ProviderError(Exception):
    """Raised when the LLM call fails."""


class ModelNotAvailableError(ProviderError):
    """Raised when the requested model is not available. Must not be retried."""


def _model() -> str:
    return os.environ.get("TIMELINE_MODEL", DEFAULT_MODEL)


def _temperature() -> float:
    try:
        return float(os.environ.get("TIMELINE_TEMPERATURE", "0.1"))
    except ValueError:
        return 0.1


def _api_key() -> str:
    key = os.environ.get("OPENROUTER_API_KEY")
    if not key:
        raise ProviderError("OPENROUTER_API_KEY environment variable is not set")
    return key


def _build_prompt(
    narration: str,
    visual_beats: list[dict[str, str]],
    duration_estimate_s: int,
) -> str:
    beat_lines = "\n".join(
        f'  {i}: [{vb["timestamp"]}] {vb["description"]}'
        for i, vb in enumerate(visual_beats)
    )

    return (
        "You are a video timeline editor. Given a narration script and a list of "
        "visual beat descriptions with timestamps, produce a segmented timeline "
        "that divides the narration across the beats.\n\n"
        f"Full narration:\n{json.dumps(narration)}\n\n"
        f"Visual beats ({len(visual_beats)} total):\n"
        f"{beat_lines}\n\n"
        f"Total clip duration: {duration_estimate_s} seconds.\n\n"
        "Requirements:\n"
        "- Produce exactly one segment per visual beat, in order.\n"
        "- Each segment has start_s (float seconds), end_s (float seconds), "
        "narration_text (the portion of the narration spoken during this segment), "
        "and subtitle_text (must equal narration_text for that segment).\n"
        "- The first start_s is 0.0; each segment's start_s equals the prior "
        "segment's end_s; the final end_s is within 1 second of the total duration.\n"
        "- Concatenating all narration_text values (normalized whitespace) must "
        "equal the full narration (normalized whitespace). Do not add or drop "
        "words.\n"
        "- Do not include a visual_instruction field.\n\n"
        "Return ONLY a JSON object with a single key 'timeline_segments' whose "
        "value is the array of segment objects. No other text."
    )


def _parse_response(raw: str) -> TimelineDraftRaw:
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        raise ProviderError(f"LLM returned unparseable output: {raw}")

    if not isinstance(parsed, dict):
        raise ProviderError(f"LLM returned non-object output: {raw}")

    extra = set(parsed.keys()) - {"timeline_segments"}
    if extra:
        raise ProviderError(
            f"LLM response contains unexpected top-level fields: {sorted(extra)}"
        )

    segments_raw = parsed.get("timeline_segments")
    if not isinstance(segments_raw, list) or len(segments_raw) == 0:
        raise ProviderError(
            "timeline_segments must be a non-empty array"
        )

    segments: list[TimelineSegmentRaw] = []
    for i, seg in enumerate(segments_raw):
        if not isinstance(seg, dict):
            raise ProviderError(
                f"timeline_segments[{i}] must be an object, got {type(seg).__name__}"
            )

        start_s = seg.get("start_s")
        end_s = seg.get("end_s")
        narration_text = seg.get("narration_text")
        subtitle_text = seg.get("subtitle_text")

        if not isinstance(start_s, (int, float)):
            raise ProviderError(
                f"timeline_segments[{i}].start_s must be a number"
            )
        if not isinstance(end_s, (int, float)):
            raise ProviderError(
                f"timeline_segments[{i}].end_s must be a number"
            )
        if not isinstance(narration_text, str):
            raise ProviderError(
                f"timeline_segments[{i}].narration_text must be a string"
            )
        if not isinstance(subtitle_text, str):
            raise ProviderError(
                f"timeline_segments[{i}].subtitle_text must be a string"
            )

        if "visual_instruction" in seg:
            raise ProviderError(
                f"timeline_segments[{i}] must not contain visual_instruction"
            )

        segments.append(
            TimelineSegmentRaw(
                start_s=float(start_s),
                end_s=float(end_s),
                narration_text=narration_text,
                subtitle_text=subtitle_text,
            )
        )

    return TimelineDraftRaw(timeline_segments=segments)


def call_llm(
    narration: str,
    visual_beats: list[dict[str, str]],
    duration_estimate_s: int,
) -> TimelineDraftRaw:
    model = _model()
    prompt = _build_prompt(narration, visual_beats, duration_estimate_s)

    system_prompt = (
        "You are a precise video timeline editor. "
        "Output only valid JSON. Never invent or modify content."
    )

    headers = {
        "Authorization": f"Bearer {_api_key()}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        "temperature": _temperature(),
        "max_tokens": 4096,
    }

    try:
        response = httpx.post(
            OPENROUTER_URL,
            headers=headers,
            json=payload,
            timeout=60.0,
        )
        response.raise_for_status()
        body = response.json()
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 404:
            raise ModelNotAvailableError(f"model not available: {model}") from exc
        raise ProviderError(f"OpenRouter API call failed: {exc}") from exc
    except httpx.HTTPError as exc:
        raise ProviderError(f"OpenRouter API call failed: {exc}") from exc

    raw = body["choices"][0]["message"]["content"]
    return _parse_response(raw)
